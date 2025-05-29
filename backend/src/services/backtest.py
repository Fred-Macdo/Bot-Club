import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
import math

from ..models.strategy import (
    Strategy,
    BacktestResult,
    BacktestParams
)

class BacktestEngine:
    """Simple backtest engine for testing strategies"""
    
    def __init__(self):
        self.initial_capital = 100000.0
        self.current_capital = 100000.0
        self.positions = {}
        self.trades = []
        self.equity_curve = []
        
    async def run_backtest(self, strategy: Strategy, params: BacktestParams) -> BacktestResult:
        """
        Run a backtest for the given strategy
        This is a simplified mock implementation for demonstration
        In a real application, you would:
        1. Fetch historical market data
        2. Apply technical indicators
        3. Execute trading logic based on conditions
        4. Calculate performance metrics
        """
        
        # Initialize backtest parameters
        self.initial_capital = params.initial_capital
        self.current_capital = params.initial_capital
        self.positions = {}
        self.trades = []
        self.equity_curve = []
        
        # Parse date range
        start_date = datetime.strptime(params.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(params.end_date, "%Y-%m-%d")
        
        # Generate mock trading data and simulate strategy execution
        await self._simulate_trading(strategy, start_date, end_date, params.timeframe)
        
        # Calculate performance metrics
        performance_stats = self._calculate_performance_stats()
        
        # Create backtest result
        backtest_result = BacktestResult(
            total_return=performance_stats["total_return"],
            sharpe_ratio=performance_stats["sharpe_ratio"],
            max_drawdown=performance_stats["max_drawdown"],
            win_rate=performance_stats["win_rate"],
            total_trades=len(self.trades),
            profit_factor=performance_stats["profit_factor"],
            initial_capital=self.initial_capital,
            final_capital=self.current_capital,
            start_date=params.start_date,
            end_date=params.end_date,
            timeframe=params.timeframe,
            trades=self.trades,
            equity_curve=self.equity_curve
        )
        
        return backtest_result
    
    async def _simulate_trading(self, strategy: Strategy, start_date: datetime, end_date: datetime, timeframe: str):
        """
        Simulate trading based on strategy configuration
        This is a mock implementation that generates realistic-looking results
        """
        current_date = start_date
        days_increment = self._get_timeframe_increment(timeframe)
        
        # Track positions for each symbol
        for symbol in strategy.config.symbols:
            self.positions[symbol] = {
                "shares": 0,
                "avg_price": 0.0,
                "unrealized_pnl": 0.0
            }
        
        trade_id = 1
        base_price = 100.0  # Starting price for simulation
        
        while current_date <= end_date:
            # Simulate price movement and trading decisions
            for symbol in strategy.config.symbols:
                # Generate mock price data (random walk with trend)
                price_change = random.uniform(-0.03, 0.03)  # ±3% daily change
                current_price = base_price * (1 + price_change)
                base_price = current_price  # Update base for next iteration
                
                # Mock entry/exit signals based on conditions
                entry_signal = self._mock_entry_signal(strategy)
                exit_signal = self._mock_exit_signal(strategy)
                
                # Execute trades based on signals
                if entry_signal and self.positions[symbol]["shares"] == 0:
                    await self._execute_buy(symbol, current_price, current_date, trade_id, strategy)
                    trade_id += 1
                elif exit_signal and self.positions[symbol]["shares"] > 0:
                    await self._execute_sell(symbol, current_price, current_date, trade_id, strategy)
                    trade_id += 1
                
                # Update equity curve
                self._update_equity_curve(current_date)
            
            # Move to next time period
            current_date += timedelta(hours=days_increment)
            
            # Add small delay to simulate processing
            await asyncio.sleep(0.001)
    
    def _get_timeframe_increment(self, timeframe: str) -> int:
        """Convert timeframe to hours increment"""
        timeframe_map = {
            "1m": 1/60,
            "5m": 5/60,
            "15m": 15/60,
            "30m": 30/60,
            "1h": 1,
            "1d": 24,
            "1w": 168,
            "1M": 720
        }
        return timeframe_map.get(timeframe, 24)
    
    def _mock_entry_signal(self, strategy: Strategy) -> bool:
        """Mock entry signal generation based on strategy conditions"""
        # Simple probability-based signal generation
        # In real implementation, this would evaluate actual technical indicators
        return random.random() < 0.1  # 10% chance of entry signal
    
    def _mock_exit_signal(self, strategy: Strategy) -> bool:
        """Mock exit signal generation"""
        # Simple probability-based signal generation
        return random.random() < 0.15  # 15% chance of exit signal
    
    async def _execute_buy(self, symbol: str, price: float, date: datetime, trade_id: int, strategy: Strategy):
        """Execute a buy order"""
        # Calculate position size based on risk management
        position_size = self._calculate_position_size(price, strategy)
        shares = position_size / price
        
        if shares * price <= self.current_capital:
            self.positions[symbol]["shares"] = shares
            self.positions[symbol]["avg_price"] = price
            self.current_capital -= shares * price
            
            # Record trade
            trade = {
                "id": trade_id,
                "symbol": symbol,
                "type": "BUY",
                "shares": shares,
                "price": price,
                "value": shares * price,
                "date": date.isoformat(),
                "pnl": 0.0
            }
            self.trades.append(trade)
    
    async def _execute_sell(self, symbol: str, price: float, date: datetime, trade_id: int, strategy: Strategy):
        """Execute a sell order"""
        position = self.positions[symbol]
        if position["shares"] > 0:
            shares = position["shares"]
            buy_price = position["avg_price"]
            sell_value = shares * price
            buy_value = shares * buy_price
            pnl = sell_value - buy_value
            
            self.current_capital += sell_value
            self.positions[symbol]["shares"] = 0
            self.positions[symbol]["avg_price"] = 0.0
            
            # Record trade
            trade = {
                "id": trade_id,
                "symbol": symbol,
                "type": "SELL",
                "shares": shares,
                "price": price,
                "value": sell_value,
                "date": date.isoformat(),
                "pnl": pnl
            }
            self.trades.append(trade)
    
    def _calculate_position_size(self, price: float, strategy: Strategy) -> float:
        """Calculate position size based on risk management rules"""
        risk_mgmt = strategy.config.risk_management
        
        if risk_mgmt.position_sizing_method == "risk_based":
            # Risk-based position sizing
            risk_amount = self.current_capital * risk_mgmt.risk_per_trade
            stop_loss_distance = price * risk_mgmt.stop_loss
            if stop_loss_distance > 0:
                position_size = risk_amount / stop_loss_distance
            else:
                position_size = self.current_capital * 0.1  # Default to 10%
        elif risk_mgmt.position_sizing_method == "percentage":
            # Percentage of capital
            position_size = self.current_capital * risk_mgmt.risk_per_trade
        else:
            # Fixed size
            position_size = min(risk_mgmt.max_position_size, self.current_capital * 0.1)
        
        # Ensure position size doesn't exceed max
        return min(position_size, risk_mgmt.max_position_size)
    
    def _update_equity_curve(self, date: datetime):
        """Update equity curve with current portfolio value"""
        total_value = self.current_capital
        
        # Add unrealized P&L from open positions
        for symbol, position in self.positions.items():
            if position["shares"] > 0:
                # Mock current price (in real implementation, use actual market data)
                current_price = position["avg_price"] * random.uniform(0.95, 1.05)
                unrealized_pnl = (current_price - position["avg_price"]) * position["shares"]
                total_value += position["avg_price"] * position["shares"] + unrealized_pnl
        
        self.equity_curve.append({
            "date": date.isoformat(),
            "equity": total_value,
            "return": ((total_value - self.initial_capital) / self.initial_capital) * 100
        })
    
    def _calculate_performance_stats(self) -> Dict[str, float]:
        """Calculate performance statistics"""
        if not self.equity_curve:
            return {
                "total_return": 0.0,
                "sharpe_ratio": 0.0,
                "max_drawdown": 0.0,
                "win_rate": 0.0,
                "profit_factor": 1.0
            }
        
        # Total return
        total_return = ((self.current_capital - self.initial_capital) / self.initial_capital) * 100
        
        # Calculate returns for Sharpe ratio
        returns = []
        for i in range(1, len(self.equity_curve)):
            prev_equity = self.equity_curve[i-1]["equity"]
            curr_equity = self.equity_curve[i]["equity"]
            if prev_equity > 0:
                daily_return = (curr_equity - prev_equity) / prev_equity
                returns.append(daily_return)
        
        # Sharpe ratio (simplified)
        if returns:
            avg_return = sum(returns) / len(returns)
            volatility = math.sqrt(sum((r - avg_return) ** 2 for r in returns) / len(returns))
            sharpe_ratio = (avg_return / volatility) if volatility > 0 else 0.0
        else:
            sharpe_ratio = 0.0
        
        # Max drawdown
        peak = self.initial_capital
        max_drawdown = 0.0
        for point in self.equity_curve:
            equity = point["equity"]
            peak = max(peak, equity)
            drawdown = (peak - equity) / peak if peak > 0 else 0.0
            max_drawdown = max(max_drawdown, drawdown)
        
        max_drawdown *= 100  # Convert to percentage
        
        # Win rate
        winning_trades = sum(1 for trade in self.trades if trade.get("pnl", 0) > 0)
        total_trades = len([trade for trade in self.trades if "pnl" in trade])
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0.0
        
        # Profit factor
        gross_profit = sum(trade["pnl"] for trade in self.trades if trade.get("pnl", 0) > 0)
        gross_loss = abs(sum(trade["pnl"] for trade in self.trades if trade.get("pnl", 0) < 0))
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 1.0
        
        return {
            "total_return": total_return,
            "sharpe_ratio": sharpe_ratio,
            "max_drawdown": max_drawdown,
            "win_rate": win_rate,
            "profit_factor": profit_factor
        }
