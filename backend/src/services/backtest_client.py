import httpx
import asyncio
import logging
import os
from typing import Dict, Any, Optional
from ..models.strategy import Strategy, BacktestParams

logger = logging.getLogger(__name__)

class BacktestServiceClient:
    """
    Client for communicating with the backend_services backtest service
    """
    
    def __init__(self, service_url: str = None):
        if service_url is None:
            service_url = os.getenv("BACKEND_SERVICES_URL", "http://backend_services:8001")
        self.service_url = service_url.rstrip('/')
        self.timeout = httpx.Timeout(30.0, connect=5.0)
        
    async def start_backtest(
        self, 
        strategy: Strategy, 
        params: BacktestParams,
        user_id: str
    ) -> Optional[str]:
        """
        Start a backtest on the backend_services container
        
        Args:
            strategy: Strategy object to backtest
            params: Backtest parameters
            user_id: ID of the user running the backtest
            
        Returns:
            Backtest execution ID if successful, None otherwise
        """
        try:
            # Prepare the request payload
            payload = {
                "strategy_id": str(strategy.id),
                "user_id": user_id,
                "initial_capital": params.initial_capital,
                "start_date": params.start_date,
                "end_date": params.end_date,
                "timeframe": params.timeframe
            }
            
            logger.info(f"Starting backtest for strategy {strategy.name} via backend_services")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.service_url}/backtest/run",
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    execution_id = result.get("backtest_id")
                    logger.info(f"Backtest started successfully, execution ID: {execution_id}")
                    return execution_id
                else:
                    logger.error(f"Failed to start backtest: {response.status_code} - {response.text}")
                    return None
                    
        except httpx.TimeoutException:
            logger.error("Timeout when connecting to backend_services")
            return None
        except Exception as e:
            logger.error(f"Error starting backtest: {e}")
            return None
    
    async def get_backtest_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a running backtest
        
        Args:
            execution_id: ID of the backtest execution
            
        Returns:
            Status information if successful, None otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.service_url}/backtest/{execution_id}/status"
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    logger.warning(f"Backtest {execution_id} not found")
                    return None
                else:
                    logger.error(f"Failed to get backtest status: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting backtest status: {e}")
            return None
    
    async def cancel_backtest(self, execution_id: str) -> bool:
        """
        Cancel a running backtest
        
        Args:
            execution_id: ID of the backtest execution
            
        Returns:
            True if successfully cancelled, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.service_url}/backtest/{execution_id}"
                )
                
                if response.status_code == 200:
                    logger.info(f"Backtest {execution_id} cancelled successfully")
                    return True
                else:
                    logger.error(f"Failed to cancel backtest: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error cancelling backtest: {e}")
            return False
    
    async def health_check(self) -> bool:
        """
        Check if the backend_services is healthy
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                response = await client.get(f"{self.service_url}/health")
                return response.status_code == 200
        except Exception:
            return False
