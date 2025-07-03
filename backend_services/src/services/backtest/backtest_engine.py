import asyncio
import lumibot
import yfinance as yf
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from services.data_providers import DataProviderFactory
from models.strategy import Strategy, StrategyConfig
from models.backtest import BacktestParams, BacktestResult

logger = logging.getLogger(__name__)


class BacktestEngine:
    """
    Core backtesting engine that executes trading strategies against historical data
    """
    
    def __init__(self, **kwargs):
        self.data_cache = {}  # Cache for historical data
        
    async def run_backtest(
        self, 
        strategy: Dict[str, Any], 
        params: BacktestParams
    ) -> BacktestResult:
        """
        Execute a complete backtest for a given strategy
        
        Args:
            strategy: Strategy configuration and rules
            params: Backtest parameters (dates, capital, etc.)
            
        Returns:
            BacktestResult with performance metrics and trade history
        """
        logger.info(f"Starting backtest for strategy: {strategy.get('name', 'Unknown')}")
        logger.info(f"This is the strategy:{strategy}")
        # Parse strategy configuration
        config = strategy.get('config', {})
        symbols = config.get('symbols', ['AAPL'])
        timeframe = params.timeframe or config.get('timeframe', '1d')
        
        # Get historical data
        data = await self._fetch_historical_data(
            symbols, 
            params.start_date, 
            params.end_date, 
            timeframe
        )
        logger.info(f"these are the params:{params}")
        logger.info(f"type of the `strategy_id`:{type(params.strategy_id)}")
        # Initialize portfolio
        portfolio = Portfolio(initial_capital=params.initial_capital)
        
        # Execute strategy
        trades = await self._execute_strategy(strategy, data, portfolio)
        
        # Calculate performance metrics
        metrics = self._calculate_performance_metrics(
            portfolio, 
            trades, 
            params.initial_capital
        )
        
        # Create result object
        result = BacktestResult(
            strategy_id=params.strategy_id,
            total_return=metrics['total_return'],
            sharpe_ratio=metrics['sharpe_ratio'],
            max_drawdown=metrics['max_drawdown'],
            win_rate=metrics['win_rate'],
            total_trades=len(trades),
            profit_factor=metrics['profit_factor'],
            initial_capital=params.initial_capital,
            final_capital=portfolio.total_value,
            start_date=params.start_date,
            end_date=params.end_date,
            timeframe=timeframe,
            trades=[trade.to_dict() for trade in trades],
            equity_curve=portfolio.get_equity_curve()
        )
        
        logger.info(f"Backtest completed: {len(trades)} trades, {metrics['total_return']:.2%} return")
        return result
        
    async def _fetch_historical_data(
        self, 
        symbols: List[str], 
        start_date: str, 
        end_date: str, 
        timeframe: str
    ) -> pd.DataFrame:
        """Fetch historical price data for the given symbols"""
        
        cache_key = f"{'-'.join(symbols)}_{start_date}_{end_date}_{timeframe}"
        
        if cache_key in self.data_cache:
            logger.info(f"Using cached data for {symbols}")
            return self.data_cache[cache_key]
            
        logger.info(f"Fetching data for {symbols} from {start_date} to {end_date}")
        
        # Convert timeframe to yfinance format
        interval_map = {
            '1d': '1d',
            '1h': '1h',
            '15m': '15m',
            '5m': '5m'
        }
        yf_interval = interval_map.get(timeframe, '1d')
        
        try:
            # Fetch data for each symbol
            all_data = {}
            for symbol in symbols:
                ticker = yf.Ticker(symbol)
                data = ticker.history(
                    start=start_date,
                    end=end_date,
                    interval=yf_interval
                )
                
                if not data.empty:
                    # Add symbol prefix to columns
                    data.columns = [f"{symbol}_{col}" for col in data.columns]
                    all_data[symbol] = data
                    
            if not all_data:
                raise ValueError("No data retrieved for any symbols")
                
            # Combine all symbol data
            combined_data = pd.concat(all_data.values(), axis=1)
            combined_data = combined_data.dropna()
            
            # Cache the data
            self.data_cache[cache_key] = combined_data
            
            logger.info(f"Retrieved {len(combined_data)} data points")
            return combined_data
            
        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            raise
            
    async def _execute_strategy(
        self, 
        strategy: Dict[str, Any], 
        data: pd.DataFrame, 
        portfolio: 'Portfolio'
    ) -> List['Trade']:
        """Execute the trading strategy against historical data"""
        
        config = strategy.get('config', {})
        entry_conditions = config.get('entry_conditions', [])
        exit_conditions = config.get('exit_conditions', [])
        risk_mgmt = config.get('risk_management', {})
        
        trades = []
        open_positions = {}
        
        # Process each data point
        for i, (timestamp, row) in enumerate(data.iterrows()):
            # Check for exit conditions first
            for symbol, position in list(open_positions.items()):
                if self._check_exit_conditions(exit_conditions, row, symbol, position, timestamp):
                    trade = self._close_position(portfolio, position, row, timestamp)
                    trades.append(trade)
                    del open_positions[symbol]
                    
            # Check for entry conditions
            for symbol in config.get('symbols', ['AAPL']):
                if symbol not in open_positions:
                    if self._check_entry_conditions(entry_conditions, row, symbol):
                        position = self._open_position(
                            portfolio, 
                            symbol, 
                            row, 
                            timestamp, 
                            risk_mgmt
                        )
                        if position:
                            open_positions[symbol] = position
                            
        # Close any remaining open positions at the end
        final_timestamp = data.index[-1]
        final_row = data.iloc[-1]
        for symbol, position in open_positions.items():
            trade = self._close_position(portfolio, position, final_row, final_timestamp)
            trades.append(trade)
            
        return trades
        
    def _check_entry_conditions(
        self, 
        conditions: List[Dict], 
        row: pd.Series, 
        symbol: str
    ) -> bool:
        """Check if entry conditions are met"""
        # Simple example: buy if price is above moving average
        # In a real implementation, you'd parse the conditions properly
        
        if not conditions:
            # Default condition: random entry for demo
            return np.random.random() < 0.1  # 10% chance to enter
            
        # TODO: Implement proper condition checking
        return False
        
    def _check_exit_conditions(
        self, 
        conditions: List[Dict], 
        row: pd.Series, 
        symbol: str, 
        position: 'Position',
        current_time: pd.Timestamp
    ) -> bool:
        """Check if exit conditions are met"""
        # Simple example: exit after 5 days or 10% profit/loss
        
        current_price = row.get(f"{symbol}_Close", 0)
        if current_price == 0:
            return False
            
        # Calculate current P&L
        pnl_pct = (current_price - position.entry_price) / position.entry_price
        
        # Exit conditions
        if abs(pnl_pct) > 0.1:  # 10% profit or loss
            return True
            
        if position.get_days_held(current_time) > 5:  # Hold for max 5 days
            return True
            
        return False
        
    def _open_position(
        self, 
        portfolio: 'Portfolio', 
        symbol: str, 
        row: pd.Series, 
        timestamp: pd.Timestamp, 
        risk_mgmt: Dict
    ) -> Optional['Position']:
        """Open a new position"""
        
        entry_price = row.get(f"{symbol}_Close", 0)
        if entry_price <= 0:
            return None
            
        # Calculate position size based on risk management
        risk_per_trade = risk_mgmt.get('risk_per_trade', 0.02)  # 2%
        max_position_size = risk_mgmt.get('max_position_size', 10000)
        
        # Simple position sizing
        position_value = min(
            portfolio.cash * risk_per_trade * 10,  # Leverage risk
            max_position_size,
            portfolio.cash * 0.95  # Don't use all cash
        )
        
        if position_value < entry_price:
            return None  # Not enough cash
            
        shares = int(position_value / entry_price)
        if shares <= 0:
            return None
            
        total_cost = shares * entry_price
        
        if portfolio.cash >= total_cost:
            portfolio.cash -= total_cost
            position = Position(
                symbol=symbol,
                shares=shares,
                entry_price=entry_price,
                entry_time=timestamp,
                entry_value=total_cost
            )
            return position
            
        return None
        
    def _close_position(
        self, 
        portfolio: 'Portfolio', 
        position: 'Position', 
        row: pd.Series, 
        timestamp: pd.Timestamp
    ) -> 'Trade':
        """Close an existing position"""
        
        exit_price = row.get(f"{position.symbol}_Close", position.entry_price)
        exit_value = position.shares * exit_price
        
        portfolio.cash += exit_value
        
        # Create trade record
        trade = Trade(
            symbol=position.symbol,
            shares=position.shares,
            entry_price=position.entry_price,
            exit_price=exit_price,
            entry_time=position.entry_time,
            exit_time=timestamp,
            pnl=exit_value - position.entry_value,
            pnl_pct=(exit_price - position.entry_price) / position.entry_price
        )
        
        return trade
        
    def _calculate_performance_metrics(
        self, 
        portfolio: 'Portfolio', 
        trades: List['Trade'], 
        initial_capital: float
    ) -> Dict[str, float]:
        """Calculate performance metrics"""
        
        if not trades:
            return {
                'total_return': 0.0,
                'sharpe_ratio': 0.0,
                'max_drawdown': 0.0,
                'win_rate': 0.0,
                'profit_factor': 0.0
            }
            
        # Total return
        total_return = (portfolio.total_value - initial_capital) / initial_capital
        
        # Win rate
        winning_trades = sum(1 for trade in trades if trade.pnl > 0)
        win_rate = winning_trades / len(trades) if trades else 0
        
        # Profit factor
        gross_profit = sum(trade.pnl for trade in trades if trade.pnl > 0)
        gross_loss = abs(sum(trade.pnl for trade in trades if trade.pnl < 0))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # Simplified metrics (would need daily returns for proper Sharpe and drawdown)
        sharpe_ratio = total_return / 0.15 if total_return > 0 else 0  # Rough estimate
        max_drawdown = -0.05  # Placeholder
        
        return {
            'total_return': total_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate,
            'profit_factor': profit_factor
        }


class Portfolio:
    """Simple portfolio tracking class"""
    
    def __init__(self, initial_capital: float):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.positions = {}
        self.equity_history = []
        
    @property
    def total_value(self) -> float:
        return self.cash
        
    def get_equity_curve(self) -> List[Dict[str, Any]]:
        """Get equity curve data"""
        return [
            {
                'timestamp': datetime.now().isoformat(),
                'value': self.total_value,
                'cash': self.cash
            }
        ]


class Position:
    """Represents an open trading position"""
    
    def __init__(
        self, 
        symbol: str, 
        shares: int, 
        entry_price: float, 
        entry_time: pd.Timestamp,
        entry_value: float
    ):
        self.symbol = symbol
        self.shares = shares
        self.entry_price = entry_price
        self.entry_time = entry_time
        self.entry_value = entry_value
        
    def get_days_held(self, current_time: pd.Timestamp) -> int:
        """Calculates the number of days the position has been held."""
        return (current_time - self.entry_time).days


class Trade:
    """Represents a completed trade"""
    
    def __init__(
        self,
        symbol: str,
        shares: int,
        entry_price: float,
        exit_price: float,
        entry_time: pd.Timestamp,
        exit_time: pd.Timestamp,
        pnl: float,
        pnl_pct: float
    ):
        self.symbol = symbol
        self.shares = shares
        self.entry_price = entry_price
        self.exit_price = exit_price
        self.entry_time = entry_time
        self.exit_time = exit_time
        self.pnl = pnl
        self.pnl_pct = pnl_pct
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            'symbol': self.symbol,
            'shares': self.shares,
            'entry_price': self.entry_price,
            'exit_price': self.exit_price,
            'entry_time': self.entry_time.isoformat(),
            'exit_time': self.exit_time.isoformat(),
            'pnl': self.pnl,
            'pnl_pct': self.pnl_pct,
            'duration_days': (self.exit_time - self.entry_time).days
        }
