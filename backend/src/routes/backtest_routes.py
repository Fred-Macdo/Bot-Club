# backend/src/routes/backtest_routes.py
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import uuid
import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dependencies import get_db, get_current_user_from_token
from ..models.user import UserInDB
from ..models.strategy import Strategy
from ..models.backtest import Backtest, BacktestCreate, BacktestResponse
from ..services.backtest import BacktestEngine
from ..services.data_providers import DataProviderFactory
from ..crud.backtest import create_backtest, get_backtest_by_id, update_backtest
from ..crud.strategy import get_strategy_by_id, get_default_strategies_from_db

router = APIRouter(prefix="/api/backtest", tags=["backtest"])

# Pydantic models for request/response
class BacktestRunRequest(BaseModel):
    strategy_id: str
    strategy_type: str  # 'default' or 'user'
    initial_capital: float
    timeframe: str
    start_date: str
    end_date: str
    data_provider: str

class BacktestRunResponse(BaseModel):
    backtest_id: str
    message: str

class BacktestStatus(BaseModel):
    status: str  # 'running', 'completed', 'failed'
    progress: int  # 0-100
    error: Optional[str] = None

class TradeDetail(BaseModel):
    id: int
    symbol: str
    side: str
    entry_date: datetime
    entry_price: float
    exit_date: Optional[datetime]
    exit_price: Optional[float]
    quantity: float
    pnl: float
    return_pct: float

class EquityCurve(BaseModel):
    dates: List[datetime]
    total_equity: List[float]
    cash_balance: List[float]
    invested_capital: List[float]

class BacktestMetrics(BaseModel):
    initial_capital: float
    final_equity: float
    total_return: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float
    profit_factor: float

class BacktestResultResponse(BaseModel):
    backtest_id: str
    strategy_name: str
    equity_curve: EquityCurve
    trades: List[TradeDetail]
    metrics: BacktestMetrics

class TradeDetailsData(BaseModel):
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    indicators: Dict[str, float]
    is_signal: bool

class TradeDetailsResponse(BaseModel):
    trade: TradeDetail
    entry_data: List[TradeDetailsData]
    exit_data: Optional[List[TradeDetailsData]] = None

class DeployRequest(BaseModel):
    strategy_id: str
    strategy_type: str
    mode: str  # 'paper' or 'live'
    initial_capital: float

class DeployResponse(BaseModel):
    success: bool
    deployment_id: str
    message: str

# Async backtest execution
async def run_backtest_async(
    backtest_id: str,
    user_id: str,
    strategy_config: dict,
    initial_capital: float,
    timeframe: str,
    start_date: str,
    end_date: str,
    data_provider: str,
    db: Session
):
    """Run backtest asynchronously and update progress in Redis"""
    try:
        # Update status to running
        await redis_client.hset(f"backtest:{backtest_id}", mapping={
            "status": "running",
            "progress": 0,
            "user_id": user_id
        })
        
        # Initialize backtest engine
        engine = BacktestEngine(
            strategy_config=strategy_config,
            initial_capital=initial_capital,
            data_provider=DataProviderFactory.get_provider(data_provider)
        )
        
        # Progress callback
        async def update_progress(progress: int, message: str):
            await redis_client.hset(f"backtest:{backtest_id}", mapping={
                "progress": progress,
                "message": message
            })
        
        # Run backtest with progress updates
        results = await engine.run(
            symbols=strategy_config.get('symbols', ['AAPL']),
            start_date=datetime.strptime(start_date, '%Y-%m-%d'),
            end_date=datetime.strptime(end_date, '%Y-%m-%d'),
            timeframe=timeframe,
            progress_callback=update_progress
        )
        
        # Save results to database
        backtest_result = BacktestResult(
            id=backtest_id,
            user_id=user_id,
            strategy_id=strategy_config['id'],
            initial_capital=initial_capital,
            final_equity=results['metrics']['final_equity'],
            total_return=results['metrics']['total_return'],
            max_drawdown=results['metrics']['max_drawdown'],
            sharpe_ratio=results['metrics']['sharpe_ratio'],
            win_rate=results['metrics']['win_rate'],
            profit_factor=results['metrics']['profit_factor'],
            total_trades=results['metrics']['total_trades'],
            equity_curve=results['equity_curve'],
            created_at=datetime.utcnow()
        )
        db.add(backtest_result)
        
        # Save trades
        for trade_data in results['trades']:
            trade = Trade(
                backtest_id=backtest_id,
                symbol=trade_data['symbol'],
                side=trade_data['side'],
                entry_date=trade_data['entry_date'],
                entry_price=trade_data['entry_price'],
                exit_date=trade_data.get('exit_date'),
                exit_price=trade_data.get('exit_price'),
                quantity=trade_data['quantity'],
                pnl=trade_data['pnl'],
                return_pct=trade_data['return_pct']
            )
            db.add(trade)
        
        db.commit()
        
        # Update status to completed
        await redis_client.hset(f"backtest:{backtest_id}", mapping={
            "status": "completed",
            "progress": 100
        })
        
        # Set expiry for Redis data (24 hours)
        await redis_client.expire(f"backtest:{backtest_id}", 86400)
        
    except Exception as e:
        # Update status to failed
        await redis_client.hset(f"backtest:{backtest_id}", mapping={
            "status": "failed",
            "error": str(e)
        })
        # Log error
        print(f"Backtest {backtest_id} failed: {str(e)}")

@router.post("/run", response_model=BacktestRunResponse)
async def run_backtest(
    request: BacktestRunRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new backtest"""
    # Validate dates
    try:
        start = datetime.strptime(request.start_date, '%Y-%m-%d')
        end = datetime.strptime(request.end_date, '%Y-%m-%d')
        if start >= end:
            raise ValueError("Start date must be before end date")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Load strategy configuration
    if request.strategy_type == 'default':
        strategy_config = StrategyLoader.load_default_strategy(
            request.strategy_id.replace('default_', '')
        )
    else:
        # Load user strategy from database
        strategy = db.query(Strategy).filter(
            Strategy.id == request.strategy_id.replace('user_', ''),
            Strategy.user_id == current_user.id
        ).first()
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        strategy_config = strategy.config
    
    if not strategy_config:
        raise HTTPException(status_code=404, detail="Strategy configuration not found")
    
    # Generate backtest ID
    backtest_id = str(uuid.uuid4())
    
    # Start backtest in background
    background_tasks.add_task(
        run_backtest_async,
        backtest_id,
        current_user.id,
        strategy_config,
        request.initial_capital,
        request.timeframe,
        request.start_date,
        request.end_date,
        request.data_provider,
        db
    )
    
    return BacktestRunResponse(
        backtest_id=backtest_id,
        message="Backtest started successfully"
    )

@router.get("/status/{backtest_id}", response_model=BacktestStatus)
async def get_backtest_status(
    backtest_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get the status of a running backtest"""
    # Get status from Redis
    data = await redis_client.hgetall(f"backtest:{backtest_id}")
    
    if not data:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    # Verify user owns this backtest
    if data.get('user_id') != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return BacktestStatus(
        status=data.get('status', 'unknown'),
        progress=int(data.get('progress', 0)),
        error=data.get('error')
    )

@router.get("/results/{backtest_id}", response_model=BacktestResultResponse)
async def get_backtest_results(
    backtest_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the results of a completed backtest"""
    # Fetch backtest from database
    backtest = db.query(BacktestResult).filter(
        BacktestResult.id == backtest_id,
        BacktestResult.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest results not found")
    
    # Fetch trades
    trades = db.query(Trade).filter(Trade.backtest_id == backtest_id).all()
    
    # Get strategy name
    strategy = db.query(Strategy).filter(Strategy.id == backtest.strategy_id).first()
    strategy_name = strategy.name if strategy else "Unknown Strategy"
    
    # Format response
    return BacktestResultResponse(
        backtest_id=backtest_id,
        strategy_name=strategy_name,
        equity_curve=EquityCurve(
            dates=backtest.equity_curve['dates'],
            total_equity=backtest.equity_curve['total_equity'],
            cash_balance=backtest.equity_curve['cash_balance'],
            invested_capital=backtest.equity_curve['invested_capital']
        ),
        trades=[
            TradeDetail(
                id=trade.id,
                symbol=trade.symbol,
                side=trade.side,
                entry_date=trade.entry_date,
                entry_price=trade.entry_price,
                exit_date=trade.exit_date,
                exit_price=trade.exit_price,
                quantity=trade.quantity,
                pnl=trade.pnl,
                return_pct=trade.return_pct
            ) for trade in trades
        ],
        metrics=BacktestMetrics(
            initial_capital=backtest.initial_capital,
            final_equity=backtest.final_equity,
            total_return=backtest.total_return,
            total_trades=backtest.total_trades,
            winning_trades=len([t for t in trades if t.pnl > 0]),
            losing_trades=len([t for t in trades if t.pnl <= 0]),
            win_rate=backtest.win_rate,
            max_drawdown=backtest.max_drawdown,
            sharpe_ratio=backtest.sharpe_ratio,
            profit_factor=backtest.profit_factor
        )
    )

@router.get("/trade-details/{backtest_id}/{trade_id}", response_model=TradeDetailsResponse)
async def get_trade_details(
    backtest_id: str,
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed OHLCV and indicator data for a specific trade"""
    # Verify backtest ownership
    backtest = db.query(BacktestResult).filter(
        BacktestResult.id == backtest_id,
        BacktestResult.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    # Get trade
    trade = db.query(Trade).filter(
        Trade.id == trade_id,
        Trade.backtest_id == backtest_id
    ).first()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    # Get strategy configuration
    strategy = db.query(Strategy).filter(Strategy.id == backtest.strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Initialize data provider
    provider = DataProviderFactory.get_provider('yahoo')  # Use provider from backtest
    
    # Fetch OHLCV data around trade dates
    window_days = 3
    entry_start = trade.entry_date - timedelta(days=window_days)
    entry_end = trade.entry_date + timedelta(days=window_days)
    
    # Get entry data
    entry_df = await provider.get_historical_data(
        symbol=trade.symbol,
        start_date=entry_start,
        end_date=entry_end,
        timeframe='1D'
    )
    
    # Calculate indicators for entry data
    entry_data = []
    for idx, row in entry_df.iterrows():
        indicators = {}
        # Add indicator values (simplified - you'd calculate actual indicators)
        for indicator in strategy.config.get('indicators', []):
            indicators[indicator['name']] = row.get(indicator['name'], 0)
        
        entry_data.append(TradeDetailsData(
            date=idx,
            open=row['open'],
            high=row['high'],
            low=row['low'],
            close=row['close'],
            volume=row['volume'],
            indicators=indicators,
            is_signal=(idx.date() == trade.entry_date.date())
        ))
    
    # Get exit data if trade is closed
    exit_data = None
    if trade.exit_date:
        exit_start = trade.exit_date - timedelta(days=window_days)
        exit_end = trade.exit_date + timedelta(days=window_days)
        
        exit_df = await provider.get_historical_data(
            symbol=trade.symbol,
            start_date=exit_start,
            end_date=exit_end,
            timeframe='1D'
        )
        
        exit_data = []
        for idx, row in exit_df.iterrows():
            indicators = {}
            for indicator in strategy.config.get('indicators', []):
                indicators[indicator['name']] = row.get(indicator['name'], 0)
            
            exit_data.append(TradeDetailsData(
                date=idx,
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
                indicators=indicators,
                is_signal=(idx.date() == trade.exit_date.date())
            ))
    
    return TradeDetailsResponse(
        trade=TradeDetail(
            id=trade.id,
            symbol=trade.symbol,
            side=trade.side,
            entry_date=trade.entry_date,
            entry_price=trade.entry_price,
            exit_date=trade.exit_date,
            exit_price=trade.exit_price,
            quantity=trade.quantity,
            pnl=trade.pnl,
            return_pct=trade.return_pct
        ),
        entry_data=entry_data,
        exit_data=exit_data
    )

@router.post("/deploy", response_model=DeployResponse)
async def deploy_strategy(
    request: DeployRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deploy a strategy to live or paper trading"""
    # Load strategy configuration
    if request.strategy_type == 'default':
        strategy_config = StrategyLoader.load_default_strategy(
            request.strategy_id.replace('default_', '')
        )
        strategy_name = strategy_config.get('name', 'Default Strategy')
    else:
        # Load user strategy
        strategy = db.query(Strategy).filter(
            Strategy.id == request.strategy_id.replace('user_', ''),
            Strategy.user_id == current_user.id
        ).first()
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        strategy_config = strategy.config
        strategy_name = strategy.name
    
    # Create deployment record
    deployment_id = str(uuid.uuid4())
    
    # In a real implementation, you would:
    # 1. Create a deployment record in the database
    # 2. Start the trading bot with the strategy configuration
    # 3. Configure risk management settings
    # 4. Set up monitoring and alerts
    
    # For now, we'll simulate the deployment
    deployment_data = {
        'deployment_id': deployment_id,
        'user_id': current_user.id,
        'strategy_name': strategy_name,
        'strategy_config': strategy_config,
        'mode': request.mode,
        'initial_capital': request.initial_capital,
        'status': 'active',
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Store deployment info in Redis (or database)
    await redis_client.hset(
        f"deployment:{deployment_id}",
        mapping=deployment_data
    )
    
    return DeployResponse(
        success=True,
        deployment_id=deployment_id,
        message=f"Strategy '{strategy_name}' successfully deployed to {request.mode} trading"
    )

# Additional routes for data providers
@router.get("/user/data-providers")
async def get_user_data_providers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available data providers for the current user"""
    providers = ['yahoo']  # Yahoo is always available
    
    # Check for configured API keys
    user_config = db.query(UserConfig).filter(
        UserConfig.user_id == current_user.id
    ).first()
    
    if user_config:
        if user_config.alpaca_api_key and user_config.alpaca_secret_key:
            providers.append('alpaca')
        if user_config.polygon_api_key:
            providers.append('polygon')
    
    return {"providers": providers}