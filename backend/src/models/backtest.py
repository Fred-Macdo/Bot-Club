from pydantic import BaseModel, Field
from datetime import date, datetime
import uuid

from typing import List, Optional, Dict, Any
from bson import ObjectId
from ..utils.mongo_helpers import PyObjectId

# FIX: This model should ONLY contain parameters for the simulation engine.
class BacktestParams(BaseModel):
    initial_capital: float
    timeframe: str
    start_date: date # Use the 'date' type for validation
    end_date: date   # Use the 'date' type for validation
    data_provider: str

class TradeData(BaseModel):
    """Individual trade data"""
    id: int = Field(..., description="Trade ID")
    symbol: str = Field(..., description="Trading symbol")
    side: str = Field(..., description="Trade side (buy/sell/long/short)")
    entry_date: str = Field(..., description="Entry date")
    entry_price: float = Field(..., description="Entry price")
    exit_date: str = Field(..., description="Exit date")
    exit_price: float = Field(..., description="Exit price")
    quantity: int = Field(..., description="Quantity traded")
    pnl: float = Field(..., description="Profit/Loss")
    return_pct: float = Field(..., description="Return percentage")
    data_context: Optional[List[Dict[str, Any]]] = Field(None, description="OHLCV data context around trade")

class EquityPoint(BaseModel):
    """Equity curve data point"""
    date: str = Field(..., description="Date")
    total_equity: float = Field(..., description="Total portfolio equity")
    cash_balance: float = Field(..., description="Cash balance")
    invested_capital: float = Field(..., description="Invested capital")

class BacktestStats(BaseModel):
    """Backtest performance statistics"""
    total_return: float = Field(..., description="Total return percentage")
    sharpe_ratio: float = Field(..., description="Sharpe ratio")
    max_drawdown: float = Field(..., description="Maximum drawdown percentage")
    win_rate: float = Field(..., description="Win rate percentage")
    total_trades: int = Field(..., description="Total number of trades")
    winning_trades: int = Field(..., description="Number of winning trades")
    losing_trades: int = Field(..., description="Number of losing trades")
    profit_factor: float = Field(..., description="Profit factor")
    avg_win: float = Field(..., description="Average winning trade percentage")
    avg_loss: float = Field(..., description="Average losing trade percentage")
    initial_capital: float = Field(..., description="Initial capital")
    final_equity: float = Field(..., description="Final equity")

class Backtest(BaseModel):
    """Main backtest model"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="User who owns this backtest")
    strategy_id: PyObjectId = Field(..., description="Strategy that was backtested")
    
    # Backtest parameters
    initial_capital: float = Field(..., description="Initial capital")
    timeframe: str = Field(..., description="Timeframe used")
    start_date: str = Field(..., description="Backtest start date")
    end_date: str = Field(..., description="Backtest end date")
    data_provider: str = Field(..., description="Data provider used")
    
    # Results
    stats: BacktestStats = Field(..., description="Performance statistics")
    trades: List[TradeData] = Field(default_factory=list, description="Individual trades")
    equity_curve: List[EquityPoint] = Field(default_factory=list, description="Equity curve data")
    
    # Metadata
    status: str = Field(default="completed", description="Backtest status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class BacktestCreate(BaseModel):
    """Model for creating a new backtest"""
    strategy_id: str = Field(..., description="Strategy ID")
    initial_capital: float = Field(default=100000.0)
    timeframe: str = Field(default="1d")
    start_date: str = Field(...)
    end_date: str = Field(...)
    data_provider: str = Field(default="alpaca")

class BacktestResponse(BaseModel):
    """Response model for backtest results"""
    id: str = Field(..., description="Backtest ID")
    user_id: str = Field(..., description="User ID")
    strategy_id: str = Field(..., description="Strategy ID")
    
    # Parameters
    initial_capital: float = Field(..., description="Initial capital")
    timeframe: str = Field(..., description="Timeframe")
    start_date: str = Field(..., description="Start date")
    end_date: str = Field(..., description="End date")
    data_provider: str = Field(..., description="Data provider")
    
    # Results
    stats: BacktestStats = Field(..., description="Performance statistics")
    trades: List[TradeData] = Field(..., description="Trades")
    equity_curve: List[EquityPoint] = Field(..., description="Equity curve")
    
    # Metadata
    status: str = Field(..., description="Status")
    created_at: datetime = Field(..., description="Creation date")
    updated_at: datetime = Field(..., description="Update date")

    class Config:
        validate_by_name = True

class BacktestSummary(BaseModel):
    """Summary model for listing backtests"""
    id: str = Field(..., description="Backtest ID")
    strategy_id: str = Field(..., description="Strategy ID")
    strategy_name: str = Field(..., description="Strategy name")
    total_return: float = Field(..., description="Total return percentage")
    sharpe_ratio: float = Field(..., description="Sharpe ratio")
    max_drawdown: float = Field(..., description="Max drawdown percentage")
    total_trades: int = Field(..., description="Total trades")
    start_date: str = Field(..., description="Start date")
    end_date: str = Field(..., description="End date")
    created_at: datetime = Field(..., description="Creation date")

    class Config:
        validate_by_name = True

class BacktestRequest(BaseModel):
    """
    Defines the shape of a request from the frontend to start a backtest.
    """
    strategy_id: str
    initial_capital: float
    timeframe: str
    start_date: date
    end_date: date
    data_provider: str

class BacktestExecution(BaseModel):
    """Tracks backtest execution state (stored in both MongoDB and Redis)"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="User who started the backtest")
    config: BacktestParams = Field(..., description="Backtest configuration")
    status: str = Field(default="pending", description="Status: pending, running, completed, failed")
    progress: int = Field(default=0, description="Progress percentage (0-100)")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = Field(None, description="When backtest started")
    completed_at: Optional[datetime] = Field(None, description="When backtest completed")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class BacktestTask(BaseModel):
    """Redis-only model for background task tracking"""
    backtest_id: str = Field(..., description="MongoDB backtest execution ID")
    status: str = Field(..., description="Current status")
    progress: int = Field(default=0, description="Progress percentage")
    current_step: str = Field(default="", description="Current processing step")
    error: Optional[str] = Field(None, description="Error message")
    logs: List[str] = Field(default_factory=list, description="Processing logs")
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
