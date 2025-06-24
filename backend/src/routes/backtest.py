from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from ..dependencies import get_db, get_current_user_from_token
from ..models.user import UserInDB
from ..models.backtest import (
    BacktestCreate,
    BacktestResponse,
    BacktestSummary,
    Backtest,
    BacktestParams,
    BacktestExecution,
    BacktestRequest
)
from ..models.strategy import Strategy
from ..crud.backtest import (
    create_backtest,
    get_backtest_by_id,
    get_backtests_by_user_id,
    get_backtests_by_strategy_id,
    update_backtest,
    delete_backtest,
    get_backtest_count_by_user,
    get_strategy_for_backtest
)
from ..crud.strategy import get_strategy_by_id, get_default_strategies_from_db
from ..services.backtest import BacktestEngine
from ..services.data_providers import DataProviderFactory
from ..services.background_tasks import task_manager
from ..crud import backtest as crud_backtest

router = APIRouter()

def backtest_to_response(backtest: Backtest) -> BacktestResponse:
    """Convert Backtest model to response model"""
    return BacktestResponse(
        id=str(backtest.id),
        user_id=str(backtest.user_id),
        strategy_id=str(backtest.strategy_id),
        initial_capital=backtest.initial_capital,
        timeframe=backtest.timeframe,
        start_date=backtest.start_date,
        end_date=backtest.end_date,
        data_provider=backtest.data_provider,
        stats=backtest.stats,
        trades=backtest.trades,
        equity_curve=backtest.equity_curve,
        status=backtest.status,
        created_at=backtest.created_at,
        updated_at=backtest.updated_at
    )

@router.get("/strategies", response_model=List[dict])
async def get_available_strategies(
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all available strategies (user's custom + default strategies) for backtest dropdown"""
    print(f"DEBUG: Getting strategies for user {current_user.id}")
    
    try:
        # Get user's custom strategies
        from ..crud.strategy import get_strategies_by_user_id
        user_strategies = await get_strategies_by_user_id(db, current_user.id)
        
        # Get default strategies  
        default_strategies = await get_default_strategies_from_db(db)
        
        # Format strategies for dropdown
        strategies = []
        
        # Add user's custom strategies
        for strategy in user_strategies:
            strategies.append({
                "id": str(strategy.id),
                "name": strategy.name,
                "description": strategy.description,
                "type": "custom",
                "is_active": strategy.is_active
            })
        
        # Add default strategies
        for strategy in default_strategies:
            strategies.append({
                "id": str(strategy.id),
                "name": strategy.name,
                "description": strategy.description,
                "type": "default",
                "is_active": True
            })
        
        return strategies
    except Exception as e:
        print(f"ERROR: Getting strategies failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get strategies: {str(e)}"
        )

@router.post("/run", response_model=dict)
async def run_backtest(
    request: BacktestRequest,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Finds the correct strategy (user or default) and starts a 
    backtest in the background.
    """
    strategy_id_str = request.strategy_id
    user_id = current_user.id

    # --- FIX: Ensure user_id is an ObjectId for the database query ---
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    elif isinstance(user_id, ObjectId):
        pass
    # --- END FIX ---

    strategy_data = await crud_backtest.get_strategy_for_backtest(db, request.strategy_id, current_user.id)

    if not strategy_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found"
        )

    # --- FIX: Create BacktestParams object from the request ---
    try:
        backtest_params = BacktestParams(
            initial_capital=request.initial_capital,
            timeframe=request.timeframe,
            start_date=request.start_date,
            end_date=request.end_date,
            data_provider=request.data_provider
        )
    except Exception as e:
         raise HTTPException(status_code=400, detail=f"Invalid backtest parameters: {e}")

    # --- FIX: Pass the object, not a dictionary, to the task manager ---
    execution_id = await task_manager.start_backtest(
        strategy_data=strategy_data,
        params=backtest_params, # Pass the validated Pydantic object
        user_id=current_user.id
    )

    return {
        "message": "Backtest started successfully",
        "backtest_id": execution_id
    }

@router.get("/status/{backtest_id}")
async def get_backtest_status(
    backtest_id: str,
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Get backtest execution status and progress"""
    try:
        status = await task_manager.get_backtest_status(backtest_id)
        return status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get backtest status: {str(e)}"
        )

@router.get("/logs/{backtest_id}")
async def get_backtest_logs(
    backtest_id: str,
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Get backtest execution logs"""
    try:
        logs = await task_manager.get_backtest_logs(backtest_id)
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get backtest logs: {str(e)}"
        )

@router.post("/cancel/{backtest_id}")
async def cancel_backtest(
    backtest_id: str,
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Cancel a running backtest"""
    try:
        cancelled = await task_manager.cancel_backtest(backtest_id)
        if cancelled:
            return {"message": "Backtest cancelled successfully"}
        else:
            return {"message": "Backtest not found or already completed"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel backtest: {str(e)}"
        )

@router.get("/", response_model=List[BacktestSummary])
async def get_user_backtests(
    limit: int = 50,
    skip: int = 0,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all backtests for the current user"""
    print(f"DEBUG: Getting backtests for user {current_user.id}")
    
    try:
        backtests = await get_backtests_by_user_id(db, current_user.id, limit, skip)
        return backtests
    except Exception as e:
        print(f"ERROR: Getting backtests failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get backtests: {str(e)}"
        )

@router.get("/{backtest_id}", response_model=BacktestResponse)
async def get_backtest(
    backtest_id: str,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a specific backtest by ID"""
    print(f"DEBUG: Getting backtest {backtest_id}")
    
    try:
        backtest = await get_backtest_by_id(db, backtest_id, current_user.id)
        if not backtest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backtest not found"
            )
        
        return backtest_to_response(backtest)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Getting backtest failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get backtest: {str(e)}"
        )

@router.get("/strategy/{strategy_id}", response_model=List[BacktestSummary])
async def get_strategy_backtests(
    strategy_id: str,
    limit: int = 10,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get backtests for a specific strategy"""
    print(f"DEBUG: Getting backtests for strategy {strategy_id}")
    
    try:
        backtests = await get_backtests_by_strategy_id(db, strategy_id, current_user.id, limit)
        return backtests
    except Exception as e:
        print(f"ERROR: Getting strategy backtests failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get strategy backtests: {str(e)}"
        )

@router.delete("/{backtest_id}")
async def delete_backtest_endpoint(
    backtest_id: str,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a backtest"""
    print(f"DEBUG: Deleting backtest {backtest_id}")
    
    try:
        success = await delete_backtest(db, backtest_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backtest not found"
            )
        
        return {"message": "Backtest deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Deleting backtest failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete backtest: {str(e)}"
        )

@router.post("/deploy/{strategy_id}")
async def deploy_strategy(
    strategy_id: str,
    deploy_type: str,  # "live" or "paper"
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Deploy a strategy to live or paper trading"""
    print(f"DEBUG: Deploying strategy {strategy_id} to {deploy_type}")
    
    try:
        # Validate strategy exists and user has access
        strategy = await get_strategy_by_id(db, strategy_id, current_user.id)
        if not strategy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Strategy not found"
            )
        
        # Validate deploy type
        if deploy_type not in ["live", "paper"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deploy type must be 'live' or 'paper'"
            )
        
        # TODO: Implement actual deployment logic
        # For now, just update the strategy status
        from ..crud.strategy import update_strategy
        
        update_data = {
            "is_active": True,
            "is_paper": deploy_type == "paper"
        }
        
        updated_strategy = await update_strategy(db, strategy_id, current_user.id, update_data)
        if not updated_strategy:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deploy strategy"
            )
        
        return {
            "message": f"Strategy deployed to {deploy_type} trading successfully",
            "strategy_id": strategy_id,
            "deploy_type": deploy_type,
            "is_active": True,
            "is_paper": deploy_type == "paper"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Strategy deployment failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Strategy deployment failed: {str(e)}"
        )

@router.get("/data-providers", response_model=List[dict])
async def get_available_data_providers(
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Get all available data providers for backtesting"""
    providers = [
        {
            "name": "yahoo",
            "display_name": "Yahoo Finance",
            "description": "Free market data from Yahoo Finance",
            "requires_auth": False,
            "supports": ["stocks", "etfs", "indices"]
        },
        {
            "name": "alpaca",
            "display_name": "Alpaca Markets",
            "description": "Real-time and historical market data from Alpaca",
            "requires_auth": True,
            "supports": ["stocks", "crypto", "options"]
        },
        {
            "name": "polygon",
            "display_name": "Polygon.io",
            "description": "Professional-grade market data",
            "requires_auth": True,
            "supports": ["stocks", "options", "forex", "crypto"]
        }
    ]
    return providers

@router.get("/data-providers/test/{provider}")
async def test_data_provider(
    provider: str,
    symbol: str = "AAPL",
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Test data provider connection and data availability"""
    try:
        # Get data provider instance
        data_provider = DataProviderFactory.get_provider(provider)
        
        # Test with a simple quote request
        quote = await data_provider.get_quote(symbol)
        
        if quote:
            return {
                "status": "success",
                "provider": provider,
                "symbol": symbol,
                "quote": quote,
                "message": f"Successfully connected to {provider} and retrieved data for {symbol}"
            }
        else:
            return {
                "status": "error",
                "provider": provider,
                "symbol": symbol,
                "message": f"Connected to {provider} but no data available for {symbol}"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "provider": provider,
            "symbol": symbol,
            "message": f"Failed to connect to {provider}: {str(e)}"
        }
