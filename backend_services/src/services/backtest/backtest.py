import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import random
import math

from ...models.backtest_status_models import (
    BacktestExecution,
    BacktestStatus
)
from ..data_providers import DataProviderFactory

# Mock DataFrame and Series classes for environments without pandas
class MockSeries:
    def __init__(self, data: List[float]):
        self.data = data
    
    def __getitem__(self, index):
        return self.data[index]
    
    def __len__(self):
        return len(self.data)
    
    def rolling(self, window):
        return MockRolling(self.data, window)
    
    def mean(self):
        return sum(self.data) / len(self.data) if self.data else 0
    
    def std(self):
        if len(self.data) < 2:
            return 0
        mean_val = self.mean()
        variance = sum((x - mean_val) ** 2 for x in self.data) / (len(self.data) - 1)
        return math.sqrt(variance)

class MockRolling:
    def __init__(self, data: List[float], window: int):
        self.data = data
        self.window = window
    
    def mean(self):
        result = []
        for i in range(len(self.data)):
            if i < self.window - 1:
                result.append(None)
            else:
                window_data = self.data[i - self.window + 1:i + 1]
                result.append(sum(window_data) / len(window_data))
        return MockSeries(result)

class MockDataFrame:
    def __init__(self, data: Dict[str, List]):
        self.data = data
        self._index = list(range(len(next(iter(data.values())))))
    
    def __getitem__(self, key):
        if isinstance(key, str):
            return MockSeries(self.data[key])
        return self
    
    def __len__(self):
        return len(self._index)
    
    def iterrows(self):
        for i in self._index:
            row_data = {col: values[i] for col, values in self.data.items()}
            yield i, MockRow(row_data)
    
    def iloc(self, index):
        if isinstance(index, int):
            row_data = {col: values[index] for col, values in self.data.items()}
            return MockRow(row_data)
        return self
    
    @property
    def index(self):
        return self._index

class MockRow:
    def __init__(self, data: Dict[str, Any]):
        self._data = data
    
    def __getitem__(self, key):
        return self._data[key]
    
    def get(self, key, default=None):
        return self._data.get(key, default)

class BacktestEngine:
    """
    Backtest engine for running strategy simulations
    """
    
    def __init__(self):
        self.portfolio_value = 0
        self.cash_balance = 0
        self.positions = {}
        self.trades = []
        self.equity_curve = []
    
    async def run_backtest(self, params: BacktestParams) -> Backtest:
        """
        Run a complete backtest simulation
        """
        print(f"DEBUG ENGINE: Starting backtest for strategy {params.strategy_id}")
        
        # Initialize portfolio
        self.cash_balance = params.initial_capital
        self.portfolio_value = params.initial_capital
        self.positions = {}
        self.trades = []
        self.equity_curve = []
        
        # Generate mock market data
        market_data = await self._generate_market_data(params)
        
        # Add technical indicators
        market_data = await self._add_indicators(market_data, params)
        
        # Simulate strategy execution
        await self._simulate_strategy(market_data, params)
        
        # Calculate performance statistics
        stats = await self._calculate_statistics(params)
        
        # Create backtest result
        result = Backtest(
            user_id="temp",  # Will be set by caller
            strategy_id=params.strategy_id,
            initial_capital=params.initial_capital,
            timeframe=params.timeframe,
            start_date=params.start_date,
            end_date=params.end_date,
            data_provider=params.data_provider,
            stats=stats,
            trades=self.trades,
            equity_curve=self.equity_curve,
            status="completed"
        )
        
        print(f"DEBUG ENGINE: Backtest completed with {len(self.trades)} trades")
        return result
    
    async def run_backtest_with_progress(
        self, 
        params: BacktestParams, 
        progress_callback
    ) -> Backtest:
        """Run backtest with progress callbacks for background execution"""
        
        await progress_callback("Initializing portfolio", 15)
        
        # Initialize portfolio
        self.cash_balance = params.initial_capital
        self.portfolio_value = params.initial_capital
        self.positions = {}
        self.trades = []
        self.equity_curve = []
        
        await progress_callback("Generating market data", 25)
        
        # Generate mock market data
        market_data = await self._generate_market_data(params)
        
        await progress_callback("Adding technical indicators", 35)
        
        # Add technical indicators
        market_data = await self._add_indicators(market_data, params)
        
        await progress_callback("Running strategy simulation", 50)
        
        # Simulate strategy execution
        await self._simulate_strategy(market_data, params)
        
        await progress_callback("Calculating performance metrics", 75)
        
        # Calculate performance statistics
        stats = await self._calculate_statistics(params)
        
        await progress_callback("Finalizing results", 85)
        
        # Create backtest result
        result = Backtest(
            user_id="temp",  # Will be set by caller
            strategy_id=params.strategy_id,
            initial_capital=params.initial_capital,
            timeframe=params.timeframe,
            start_date=params.start_date,
            end_date=params.end_date,
            data_provider=params.data_provider,
            stats=stats,
            trades=self.trades,
            equity_curve=self.equity_curve,
            status="completed"
        )
        
        return result
    
    async def _generate_market_data(self, params: BacktestParams) -> MockDataFrame:
        """
        Generate mock OHLCV market data
        """
        print(f"DEBUG ENGINE: Generating market data from {params.start_date} to {params.end_date}")
        
        # Parse dates
        start_date = datetime.strptime(params.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(params.end_date, "%Y-%m-%d")
        
        # Generate date range (daily data for now)
        dates = []
        current_date = start_date
        while current_date <= end_date:
            # Skip weekends for stock data
            if current_date.weekday() < 5:
                dates.append(current_date.strftime("%Y-%m-%d"))
            current_date += timedelta(days=1)
        
        # Generate realistic OHLCV data
        num_days = len(dates)
        base_price = 100.0
        
        data = {
            "date": dates,
            "open": [],
            "high": [],
            "low": [],
            "close": [],
            "volume": []
        }
        
        current_price = base_price
        
        for i in range(num_days):
            # Generate daily price movement
            daily_change = random.uniform(-0.05, 0.05)  # -5% to +5% daily change
            
            open_price = current_price
            close_price = open_price * (1 + daily_change)
            
            # Generate high and low
            high_price = max(open_price, close_price) * random.uniform(1.001, 1.02)
            low_price = min(open_price, close_price) * random.uniform(0.98, 0.999)
            
            # Generate volume
            volume = random.randint(100000, 1000000)
            
            data["open"].append(round(open_price, 2))
            data["high"].append(round(high_price, 2))
            data["low"].append(round(low_price, 2))
            data["close"].append(round(close_price, 2))
            data["volume"].append(volume)
            
            current_price = close_price
        
        return MockDataFrame(data)
    
    async def _add_indicators(self, data: MockDataFrame, params: BacktestParams) -> MockDataFrame:
        """
        Add technical indicators to market data
        """
        print("DEBUG ENGINE: Adding technical indicators")
        
        # Simple Moving Average (20-period)
        close_prices = data["close"].data
        sma_20 = []
        
        for i in range(len(close_prices)):
            if i < 19:
                sma_20.append(None)
            else:
                avg = sum(close_prices[i-19:i+1]) / 20
                sma_20.append(round(avg, 2))
        
        # Simple momentum indicator (price vs SMA)
        indicator = []
        indicator_prev = []
        
        for i in range(len(close_prices)):
            if sma_20[i] is not None:
                momentum = (close_prices[i] / sma_20[i] - 1) * 100  # Percentage above/below SMA
                indicator.append(round(momentum, 4))
                
                # Previous value
                if i > 0 and indicator:
                    indicator_prev.append(indicator[-2] if len(indicator) > 1 else None)
                else:
                    indicator_prev.append(None)
            else:
                indicator.append(None)
                indicator_prev.append(None)
        
        # Add indicators to data
        data.data["sma_20"] = sma_20
        data.data["indicator"] = indicator
        data.data["indicator_prev"] = indicator_prev
        
        return data
    
    async def _simulate_strategy(self, data: MockDataFrame, params: BacktestParams):
        """
        Simulate strategy execution with entry/exit signals
        """
        print("DEBUG ENGINE: Simulating strategy execution")
        
        symbol = "AAPL"  # Default symbol for simulation
        position_size = 0
        entry_price = None
        entry_date = None
        trade_id = 1
        
        for i, (idx, row) in enumerate(data.iterrows()):
            date = row["date"]
            close_price = row["close"]
            indicator_val = row.get("indicator")
            indicator_prev_val = row.get("indicator_prev")
            
            # Skip if indicators not ready
            if indicator_val is None or indicator_prev_val is None:
                continue
            
            # Simple strategy: Buy when price crosses above SMA, sell when crosses below
            buy_signal = indicator_val > 0 and indicator_prev_val <= 0  # Cross above SMA
            sell_signal = indicator_val < 0 and indicator_prev_val >= 0  # Cross below SMA
            
            has_signal = buy_signal or sell_signal
            signal_type = "buy" if buy_signal else "sell" if sell_signal else None
            
            # Add data analysis row (with context around signals)

            # Execute trades
            if position_size == 0 and buy_signal:
                # Enter long position
                position_value = min(self.cash_balance * 0.95, 10000)  # Risk management
                if position_value > 100:  # Minimum position size
                    position_size = int(position_value / close_price)
                    cost = position_size * close_price
                    
                    if cost <= self.cash_balance:
                        self.cash_balance -= cost
                        entry_price = close_price
                        entry_date = date
                        print(f"DEBUG: BUY {position_size} shares at ${close_price} on {date}")
            
            elif position_size > 0 and sell_signal:
                # Exit long position
                sale_proceeds = position_size * close_price
                self.cash_balance += sale_proceeds
                
                # Calculate trade PnL
                pnl = sale_proceeds - (position_size * entry_price)
                return_pct = (close_price / entry_price - 1) * 100
                
                # Create trade record
                trade = TradeData(
                    id=trade_id,
                    symbol=symbol,
                    side="long",
                    entry_date=entry_date,
                    entry_price=entry_price,
                    exit_date=date,
                    exit_price=close_price,
                    quantity=position_size,
                    pnl=round(pnl, 2),
                    return_pct=round(return_pct, 2)
                )
                
                self.trades.append(trade)
                trade_id += 1
                
                print(f"DEBUG: SELL {position_size} shares at ${close_price} on {date}, PnL: ${pnl:.2f}")
                
                position_size = 0
                entry_price = None
                entry_date = None
            
            # Update portfolio value and equity curve
            invested_capital = position_size * close_price if position_size > 0 else 0
            total_equity = self.cash_balance + invested_capital
            
            equity_point = EquityPoint(
                date=date,
                total_equity=round(total_equity, 2),
                cash_balance=round(self.cash_balance, 2),
                invested_capital=round(invested_capital, 2)
            )
            self.equity_curve.append(equity_point)
    
    async def _calculate_statistics(self, params: BacktestParams) -> BacktestStats:
        """
        Calculate backtest performance statistics
        """
        print("DEBUG ENGINE: Calculating performance statistics")
        
        if not self.equity_curve:
            # Return default stats if no data
            return BacktestStats(
                total_return=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                win_rate=0.0,
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                profit_factor=0.0,
                avg_win=0.0,
                avg_loss=0.0,
                initial_capital=params.initial_capital,
                final_equity=params.initial_capital
            )
        
        # Basic stats
        initial_capital = params.initial_capital
        final_equity = self.equity_curve[-1].total_equity
        total_return = ((final_equity / initial_capital) - 1) * 100
        
        # Trade statistics
        total_trades = len(self.trades)
        winning_trades = len([t for t in self.trades if t.pnl > 0])
        losing_trades = len([t for t in self.trades if t.pnl < 0])
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        # PnL statistics
        winning_pnls = [t.pnl for t in self.trades if t.pnl > 0]
        losing_pnls = [t.pnl for t in self.trades if t.pnl < 0]
        
        avg_win = (sum(winning_pnls) / len(winning_pnls)) if winning_pnls else 0
        avg_loss = (sum(losing_pnls) / len(losing_pnls)) if losing_pnls else 0
        
        gross_profit = sum(winning_pnls) if winning_pnls else 0
        gross_loss = abs(sum(losing_pnls)) if losing_pnls else 0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 0
        
        # Calculate max drawdown
        max_drawdown = await self._calculate_max_drawdown()
        
        # Calculate Sharpe ratio (simplified)
        returns = []
        for i in range(1, len(self.equity_curve)):
            prev_equity = self.equity_curve[i-1].total_equity
            curr_equity = self.equity_curve[i].total_equity
            daily_return = (curr_equity / prev_equity - 1) if prev_equity > 0 else 0
            returns.append(daily_return)
        
        if len(returns) > 1:
            returns_series = MockSeries(returns)
            avg_return = returns_series.mean()
            std_return = returns_series.std()
            sharpe_ratio = (avg_return / std_return * math.sqrt(252)) if std_return > 0 else 0
        else:
            sharpe_ratio = 0
        
        return BacktestStats(
            total_return=round(total_return, 2),
            sharpe_ratio=round(sharpe_ratio, 2),
            max_drawdown=round(max_drawdown, 2),
            win_rate=round(win_rate, 2),
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            profit_factor=round(profit_factor, 2),
            avg_win=round(avg_win, 2),
            avg_loss=round(avg_loss, 2),
            initial_capital=initial_capital,
            final_equity=round(final_equity, 2)
        )
    
    async def _calculate_max_drawdown(self) -> float:
        """
        Calculate maximum drawdown percentage
        """
        if len(self.equity_curve) < 2:
            return 0.0
        
        peak = self.equity_curve[0].total_equity
        max_dd = 0.0
        
        for point in self.equity_curve:
            if point.total_equity > peak:
                peak = point.total_equity
            
            drawdown = (peak - point.total_equity) / peak * 100
            if drawdown > max_dd:
                max_dd = drawdown
        
        return max_dd
