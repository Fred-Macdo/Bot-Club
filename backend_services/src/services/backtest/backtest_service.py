import asyncio
import json
import uuid
import httpx
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import traceback
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.strategy import Strategy, BacktestParams, BacktestResult, StrategyConfig
from models.backtest import BacktestExecution, BacktestStatus
from config import API_SERVICE_URL
from .backtest_engine import BacktestEngine

logger = logging.getLogger(__name__)

class BacktestService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.active_backtests = {}  # Track running backtests
        self.backtest_engine = BacktestEngine()
        
    async def initialize(self):
        """Initialize the backtest service"""
        logger.info("Initializing backtest service")
        # Ensure we have the necessary collections
        if "backtest_executions" not in await self.db.list_collection_names():
            logger.info("Creating backtest_executions collection")
            await self.db.create_collection("backtest_executions")

    async def start_backtest(self, strategy_id: str, user_id: str, params: Dict[str, Any]) -> str:
        """
        Start a new backtest
        
        Args:
            strategy_id: ID of the strategy to backtest
            user_id: ID of the user running the backtest
            params: Backtest parameters
            
        Returns:
            ID of the new backtest execution
        """
        # Create a unique ID for this backtest
        execution_id = str(uuid.uuid4())
        
        # Find the strategy
        strategy = await self._get_strategy_for_backtest(strategy_id, user_id)
        if not strategy:
            raise ValueError(f"Strategy not found: {strategy_id}")
        
        # Create backtest execution record
        execution = BacktestExecution(
            id=execution_id,
            user_id=user_id,
            strategy_id=strategy_id,
            strategy_name=strategy.get("name", "Unknown Strategy"),
            status=BacktestStatus.PENDING,
            params=params
        )
        
        # Save to database
        await self.db.backtest_executions.insert_one(execution.dict())
        
        # Start the backtest in the background
        asyncio.create_task(self._run_backtest_with_engine(execution_id, strategy, params))
        
        return execution_id
    
    async def _run_backtest_with_engine(self, execution_id: str, strategy: Dict, params: Dict):
        """Run backtest using the proper backtest engine"""
        logger.info(f"Starting backtest {execution_id} for strategy {strategy['name']}")
        
        try:
            # Track this backtest as active
            self.active_backtests[execution_id] = {
                "start_time": datetime.utcnow(),
                "strategy": strategy["name"],
                "task": asyncio.current_task()
            }
            
            # Update status to running
            await self._update_execution_status(execution_id, BacktestStatus.RUNNING, 10)
            
            # Create BacktestParams object
            backtest_params = BacktestParams(
                start_date=params.get('start_date'),
                end_date=params.get('end_date'),
                initial_capital=params.get('initial_capital', 100000.0),
                timeframe=params.get('timeframe', '1d')
            )
            
            # Update status
            await self._update_execution_status(
                execution_id, 
                BacktestStatus.RUNNING, 
                30, 
                "Initializing backtest engine"
            )
            
            # Run the actual backtest
            result = await self.backtest_engine.run_backtest(strategy, backtest_params)
            
            # Update status
            await self._update_execution_status(
                execution_id, 
                BacktestStatus.RUNNING, 
                90, 
                "Saving results"
            )
            
            # Save result to main backend database via API call
            await self._save_result_to_backend(strategy['_id'], result)
            
            # Complete the backtest
            await self._update_execution_status(
                execution_id, 
                BacktestStatus.COMPLETED, 
                100, 
                "Backtest completed successfully",
                result.dict()
            )
            
            logger.info(f"Backtest {execution_id} completed successfully")
            
        except asyncio.CancelledError:
            logger.warning(f"Backtest {execution_id} was cancelled")
            await self._update_execution_status(
                execution_id, 
                BacktestStatus.CANCELLED, 
                0, 
                "Backtest was cancelled"
            )
            
        except Exception as e:
            error_msg = f"Backtest failed: {str(e)}"
            logger.error(f"Error in backtest {execution_id}: {error_msg}")
            logger.error(traceback.format_exc())
            await self._update_execution_status(
                execution_id, 
                BacktestStatus.FAILED, 
                0, 
                error_msg
            )
            
        finally:
            # Remove from active backtests
            if execution_id in self.active_backtests:
                del self.active_backtests[execution_id]
    
    async def _save_result_to_backend(self, strategy_id: str, result: BacktestResult):
        """Save backtest result to the main backend database"""
        try:
            # Convert result to dict for API call
            result_data = result.dict()
            result_data['strategy_id'] = str(strategy_id)
            
            # Make API call to backend to save the result
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{API_SERVICE_URL}/api/backtest/save_result",
                    json=result_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Successfully saved backtest result for strategy {strategy_id}")
                else:
                    logger.error(f"Failed to save backtest result: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"Error saving backtest result to backend: {e}")
    
    async def _update_execution_status(
        self, 
        execution_id: str, 
        status: BacktestStatus, 
        progress: int, 
        message: str = None,
        result: Dict = None
    ):
        """Update the status of a backtest execution in the database"""
        update = {
            "status": status.value,
            "progress": progress,
            "updated_at": datetime.utcnow()
        }
        
        if message:
            update["message"] = message
            
        if result:
            update["result"] = result
            
        if status in [BacktestStatus.COMPLETED, BacktestStatus.FAILED, BacktestStatus.CANCELLED]:
            update["end_time"] = datetime.utcnow()
            
        await self.db.backtest_executions.update_one(
            {"id": execution_id},
            {"$set": update}
        )
    
    async def _get_strategy_for_backtest(self, strategy_id: str, user_id: str):
        """Find a strategy for backtest, checking both custom and default strategies"""
        try:
            strategy_obj_id = ObjectId(strategy_id)
        except Exception:
            logger.error(f"Invalid ObjectId format for strategy: {strategy_id}")
            return None

        # First try as a default strategy (no user required)
        default_strategy = await self.db.default_strategies.find_one({"_id": strategy_obj_id})
        if default_strategy:
            logger.info(f"Found default strategy: {default_strategy['name']}")
            return default_strategy

        # Try to convert user_id to ObjectId for user strategy lookup
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            # If user_id is not an ObjectId, try as string
            user_strategy = await self.db.strategy.find_one({
                "_id": strategy_obj_id,
                "user_id": user_id
            })
            if user_strategy:
                logger.info(f"Found user strategy: {user_strategy['name']}")
                return user_strategy
        else:
            # Try as a user strategy with ObjectId user_id
            user_strategy = await self.db.strategy.find_one({
                "_id": strategy_obj_id,
                "$or": [
                    {"user_id": user_obj_id},
                    {"user_id": user_id}
                ]
            })
            if user_strategy:
                logger.info(f"Found user strategy: {user_strategy['name']}")
                return user_strategy
            
        logger.warning(f"Strategy not found with ID: {strategy_id}")
        return None
    
    async def _run_backtest(self, execution_id: str, strategy: Dict, params: Dict):
        """Run the actual backtest simulation"""
        logger.info(f"Starting backtest {execution_id} for strategy {strategy['name']}")
        
        try:
            # Track this backtest as active
            self.active_backtests[execution_id] = {
                "start_time": datetime.utcnow(),
                "strategy": strategy["name"],
                "task": asyncio.current_task()
            }
            
            # Update status to running
            await self._update_status(execution_id, "running", 10)
            
            # This is where you would call your actual backtest engine
            # For now, we'll simulate a backtest with delays
            
            # Simulating data loading step
            await asyncio.sleep(2)
            await self._update_status(execution_id, "running", 30, "Loading market data")
            
            # Simulating strategy execution
            await asyncio.sleep(3)
            await self._update_status(execution_id, "running", 60, "Executing strategy")
            
            # Simulating results compilation
            await asyncio.sleep(2)
            await self._update_status(execution_id, "running", 90, "Compiling results")
            
            # Generate sample results
            results = {
                "total_trades": 32,
                "win_rate": 0.65,
                "profit_loss": 2150.75,
                "sharpe_ratio": 1.2,
                "max_drawdown": -0.12,
                "annual_return": 0.18,
            }
            
            # Complete the backtest
            await self._update_status(
                execution_id, 
                "completed", 
                100, 
                "Backtest completed successfully",
                results
            )
            
            logger.info(f"Backtest {execution_id} completed successfully")
            
        except asyncio.CancelledError:
            logger.warning(f"Backtest {execution_id} was cancelled")
            await self._update_status(execution_id, "cancelled", 0, "Backtest was cancelled")
            
        except Exception as e:
            error_msg = f"Backtest failed: {str(e)}"
            logger.error(f"Error in backtest {execution_id}: {error_msg}")
            logger.error(traceback.format_exc())
            await self._update_status(execution_id, "failed", 0, error_msg)
            
        finally:
            # Remove from active backtests
            if execution_id in self.active_backtests:
                del self.active_backtests[execution_id]
    
    async def _update_status(
        self, 
        execution_id: str, 
        status: str, 
        progress: int, 
        message: str = None,
        results: Dict = None
    ):
        """Update the status of a backtest in the database - DEPRECATED"""
        # This method is kept for backward compatibility
        # Use _update_execution_status instead
        await self._update_execution_status(
            execution_id,
            BacktestStatus(status),
            progress,
            message,
            results
        )
    
    async def get_status(self, backtest_id: str) -> Optional[Dict[str, Any]]:
        """Get the current status of a backtest"""
        result = await self.db.backtest_executions.find_one({"id": backtest_id})
        if not result:
            return None
            
        # Convert ObjectId to string for JSON serialization
        if "_id" in result and isinstance(result["_id"], ObjectId):
            result["_id"] = str(result["_id"])
            
        # Convert datetime objects to ISO format strings
        for field in ["start_time", "end_time", "updated_at"]:
            if field in result and result[field] is not None:
                if hasattr(result[field], 'isoformat'):
                    result[field] = result[field].isoformat()
            
        return result
    
    async def cancel_backtest(self, backtest_id: str) -> bool:
        """Cancel a running backtest"""
        if backtest_id in self.active_backtests:
            task = self.active_backtests[backtest_id]["task"]
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                return True
        return False
        
    async def shutdown(self):
        """Clean shutdown of the service"""
        logger.info(f"Shutting down backtest service, cancelling {len(self.active_backtests)} active backtests")
        
        # Cancel all running backtests
        for backtest_id, backtest in list(self.active_backtests.items()):
            if not backtest["task"].done():
                logger.info(f"Cancelling backtest {backtest_id}")
                backtest["task"].cancel()
                
        # Wait for all tasks to complete
        active_tasks = [backtest["task"] for backtest in self.active_backtests.values()]
        if active_tasks:
            await asyncio.gather(*active_tasks, return_exceptions=True)
            
        logger.info("Backtest service shutdown complete")