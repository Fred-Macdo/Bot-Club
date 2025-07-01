import httpx
import asyncio
from typing import Dict, Any
import logging
from datetime import datetime
import os

from ...models.strategy import BacktestParams, BacktestResult

logger = logging.getLogger(__name__)

class BacktestEngine:
    """
    Client for communicating with the backend_services backtest engine
    """
    
    def __init__(self):
        # Get the backend_services URL from environment or use default
        self.backend_services_url = os.getenv("BACKEND_SERVICES_URL", "http://backend_services:8001")
        print(f"BacktestEngine initialized with backend_services_url: {self.backend_services_url}")
        
    async def run_backtest(
        self, 
        strategy: Dict[str, Any], 
        params: BacktestParams
    ) -> BacktestResult:
        """
        Execute a backtest by calling the backend_services API
        
        Args:
            strategy: Strategy configuration and rules
            params: Backtest parameters (dates, capital, etc.)
            
        Returns:
            BacktestResult with performance metrics and trade history
        """
        logger.info(f"Initiating backtest for strategy: {strategy.get('name', 'Unknown')}")
        print(f"Backtest parameters: {params}")
        print(f"sending strategy to backend_services: {strategy}")
        try:
            # Prepare the payload for the API call
            # The payload is a single object containing both strategy and params
            payload = {
                "strategy": strategy,
                "params": params.model_dump(mode="json")
            }
            
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minute timeout for backtests
                response = await client.post(
                    f"{self.backend_services_url}/api/v1/backtest/run",
                    json=payload
                )
                response.raise_for_status()
                
                result_data = response.json()
                
                # Convert the response back to a BacktestResult object
                result = BacktestResult(
                    strategy_id=result_data.get("strategy_id"),
                    total_return=result_data.get("total_return", 0.0),
                    sharpe_ratio=result_data.get("sharpe_ratio", 0.0),
                    max_drawdown=result_data.get("max_drawdown", 0.0),
                    win_rate=result_data.get("win_rate", 0.0),
                    total_trades=result_data.get("total_trades", 0),
                    profit_factor=result_data.get("profit_factor", 0.0),
                    initial_capital=result_data.get("initial_capital", params.initial_capital),
                    final_capital=result_data.get("final_capital", params.initial_capital),
                    start_date=result_data.get("start_date", params.start_date),
                    end_date=result_data.get("end_date", params.end_date),
                    timeframe=result_data.get("timeframe", params.timeframe),
                    trades=result_data.get("trades", []),
                    equity_curve=result_data.get("equity_curve", [])
                )
                
                logger.info(f"Backtest completed successfully: {result.total_trades} trades, {result.total_return:.2%} return")
                return result
                
        except httpx.RequestError as e:
            logger.error(f"Network error during backtest: {e}")
            # Return a default result indicating failure
            return BacktestResult(
                strategy_id=strategy.get('_id'),
                total_return=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                win_rate=0.0,
                total_trades=0,
                profit_factor=0.0,
                initial_capital=params.initial_capital,
                final_capital=params.initial_capital,
                start_date=params.start_date,
                end_date=params.end_date,
                timeframe=params.timeframe,
                trades=[],
                equity_curve=[],
                error="Network error: Could not connect to backend services"
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during backtest: {e}")
            # Return a default result indicating failure
            return BacktestResult(
                strategy_id=strategy.get('_id'),
                total_return=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                win_rate=0.0,
                total_trades=0,
                profit_factor=0.0,
                initial_capital=params.initial_capital,
                final_capital=params.initial_capital,
                start_date=params.start_date,
                end_date=params.end_date,
                timeframe=params.timeframe,
                trades=[],
                equity_curve=[],
                error=f"Backend services error: {e}"
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during backtest: {e}")
            # Return a default result indicating failure
            return BacktestResult(
                strategy_id=strategy.get('_id'),
                total_return=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                win_rate=0.0,
                total_trades=0,
                profit_factor=0.0,
                initial_capital=params.initial_capital,
                final_capital=params.initial_capital,
                start_date=params.start_date,
                end_date=params.end_date,
                timeframe=params.timeframe,
                trades=[],
                equity_curve=[],
                error=f"Unexpected error: {str(e)}"
            )
