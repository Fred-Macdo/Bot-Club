from datetime import datetime, date
from typing import List, Any, Dict
from pydantic import BaseModel, Field
from bson import ObjectId

from .strategy import PyObjectId  # Assuming PyObjectId is in strategy.py

class BacktestParams(BaseModel):
    """Parameters for running a backtest"""
    strategy_id: str
    initial_capital: float
    timeframe: str
    start_date: date
    end_date: date
    data_provider: str

class BacktestResult(BaseModel):
    """Backtest results"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    strategy_id: PyObjectId = Field(..., description="Strategy ID")
    total_return: float = Field(..., description="Total return percentage")
    sharpe_ratio: float = Field(..., description="Sharpe ratio")
    max_drawdown: float = Field(..., description="Maximum drawdown percentage")
    win_rate: float = Field(..., description="Win rate percentage")
    total_trades: int = Field(..., description="Total number of trades")
    profit_factor: float = Field(..., description="Profit factor")
    initial_capital: float = Field(..., description="Initial capital amount")
    final_capital: float = Field(..., description="Final capital amount")
    start_date: str = Field(..., description="Backtest start date")
    end_date: str = Field(..., description="Backtest end date")
    timeframe: str = Field(..., description="Backtest timeframe")
    trades: List[Dict[str, Any]] = Field(default_factory=list, description="Individual trade details")
    equity_curve: List[Dict[str, Any]] = Field(default_factory=list, description="Equity curve data")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
