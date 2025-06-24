import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Dict, Any
from datetime import datetime

from ..dependencies import get_db, get_mongodb_client
from ..models.backtest import BacktestParams
from ..crud import backtest as crud_backtest

class TaskManager:
    def __init__(self):
        self.db: AsyncIOMotorDatabase = None
        self.client = None

    async def initialize(self):
        try:
            # Get a fresh client
            self.client = await get_mongodb_client()
            self.db = self.client.get_database()
            print("Task Manager initialized with DB connection.")
        except Exception as e:
            print(f"Error initializing task manager: {e}")
            self.db = None

    async def start_backtest(self, strategy_data: dict, params: BacktestParams, user_id: ObjectId) -> str:
        """
        Creates the backtest execution record and starts the background task.
        """
        if not self.db:
            await self.initialize()
            if not self.db:
                raise ValueError("Could not initialize database connection")

        # Create the initial record in the database
        execution_id = await crud_backtest.create_backtest_execution(
            db=self.db,
            user_id=str(user_id),
            strategy_id=str(strategy_data["_id"]),
            strategy_name=strategy_data.get("name", "Unnamed Strategy"),
            config=params.model_dump(mode='json')
        )

        # Start the actual long-running task in the background
        asyncio.create_task(self._run_backtest_simulation(execution_id, strategy_data, params))

        return execution_id

    async def _run_backtest_simulation(self, execution_id: str, strategy_data: dict, params: BacktestParams):
        """This is where the long-running Lumibot simulation would go."""
        print(f"Starting simulation for backtest ID: {execution_id}")
        try:
            # Ensure we have a DB connection
            if not self.db:
                await self.initialize()
                if not self.db:
                    raise ValueError("Could not initialize database connection")
                
            # Simulate work
            await asyncio.sleep(2)
            await crud_backtest.update_backtest_status(self.db, execution_id, "running", 30)
            
            await asyncio.sleep(3)
            await crud_backtest.update_backtest_status(self.db, execution_id, "running", 60)
            
            await asyncio.sleep(2)
            await crud_backtest.update_backtest_status(self.db, execution_id, "running", 90)

            # Finish
            print(f"Simulation complete for backtest ID: {execution_id}")
            await crud_backtest.update_backtest_status(self.db, execution_id, "completed", 100)

        except Exception as e:
            print(f"Backtest simulation failed for {execution_id}: {e}")
            if self.db:
                await crud_backtest.update_backtest_status(self.db, execution_id, "failed", error_message=str(e))


# Create a singleton instance of the task manager
task_manager = TaskManager()
