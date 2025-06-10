// src/components/backtest/Backtest.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  useTheme,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import Sidebar from '../common/Sidebar';
import Button from '../common/Button';
import { useStrategy } from '../../context/StrategyContext';
import { useAuth } from '../router/AuthContext';
import { fetchDefaultStrategies } from '../../api/AlpacaService';

// Transform backend strategy data to frontend format
const transformDefaultStrategies = (backendStrategies) => {
  return backendStrategies.map((strategy, index) => {
    const indicators = strategy.config?.indicators?.map(ind => ind.name) || [];
    
    // Determine category based on strategy name/indicators
    let category = 'Trading';
    if (strategy.name.toLowerCase().includes('ema') || strategy.name.toLowerCase().includes('crossover')) {
      category = 'Trend Following';
    } else if (strategy.name.toLowerCase().includes('bollinger')) {
      category = 'Breakout';
    } else if (strategy.name.toLowerCase().includes('macd')) {
      category = 'Momentum';
    } else if (strategy.name.toLowerCase().includes('rsi')) {
      category = 'Mean Reversion';
    }
    
    // Determine complexity based on number of indicators and conditions
    let complexity = 'Beginner';
    const totalConditions = (strategy.config?.entry_conditions?.length || 0) + 
                          (strategy.config?.exit_conditions?.length || 0);
    if (totalConditions > 3 || indicators.length > 2) {
      complexity = 'Advanced';
    } else if (totalConditions > 1 || indicators.length > 1) {
      complexity = 'Intermediate';
    }
    
    return {
      id: `default_${index + 1}`,
      name: strategy.name,
      description: strategy.description || 'No description provided',
      type: 'default',
      category,
      complexity,
      indicators,
      timeframes: strategy.config?.timeframe ? [strategy.config.timeframe.toUpperCase()] : ['1D'],
      config: strategy.config
    };
  });
};

const Backtest = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { strategies: userStrategies, loading: strategiesLoading } = useStrategy();

  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestComplete, setBacktestComplete] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-05-09');
  const [plotlyData, setPlotlyData] = useState([]);
  const [plotlyLayout, setPlotlyLayout] = useState({});
  
  // Strategy Library state
  const [defaultStrategies, setDefaultStrategies] = useState([]);
  const [defaultStrategiesLoading, setDefaultStrategiesLoading] = useState(true);
  const [defaultStrategiesError, setDefaultStrategiesError] = useState(null);

  // Fetch default strategies on component mount
  useEffect(() => {
    const loadDefaultStrategies = async () => {
      try {
        setDefaultStrategiesLoading(true);
        setDefaultStrategiesError(null);
        const result = await fetchDefaultStrategies();
        if (result.success) {
          const transformedStrategies = transformDefaultStrategies(result.strategies);
          setDefaultStrategies(transformedStrategies);
        } else {
          setDefaultStrategiesError(result.error);
        }
      } catch (error) {
        console.error('Error loading default strategies:', error);
        setDefaultStrategiesError('Failed to load default strategies');
      } finally {
        setDefaultStrategiesLoading(false);
      }
    };

    loadDefaultStrategies();
  }, []);

  // Combine default and user strategies
  const savedStrategies = useMemo(() => {
    const userStrategiesFormatted = userStrategies.map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      description: strategy.description || 'No description provided',
      type: 'user',
      category: 'Custom',
      complexity: 'Custom',
      indicators: strategy.config?.indicators?.map(ind => ind.name) || [],
      timeframes: strategy.config?.timeframe ? [strategy.config.timeframe] : [],
      config: strategy.config
    }));

    return [...defaultStrategies, ...userStrategiesFormatted];
  }, [defaultStrategies, userStrategies]);

  const timeframeOptions = [
    { value: '1Min', label: '1 Minute' },
    { value: '5Min', label: '5 Minutes' },
    { value: '15Min', label: '15 Minutes' },
    { value: '30Min', label: '30 Minutes' },
    { value: '1H', label: '1 Hour' },
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' }
  ];

  const runBacktest = () => {
    setIsBacktesting(true);

    setTimeout(() => {
      const mockResults = generateMockBacktestResults(initialCapital, startDate, endDate);
      setBacktestResults(mockResults);
      setBacktestComplete(true);
      setIsBacktesting(false);
    }, 1500);
  };

  const resetBacktest = () => {
    setBacktestComplete(false);
    setBacktestResults(null);
    setPlotlyData([]);
    setPlotlyLayout({});
  };

  const generateMockBacktestResults = (initialCapital, startDate, endDate) => {
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();
    const dayDuration = 24 * 60 * 60 * 1000;
    const numberOfDays = Math.floor((endTimestamp - startTimestamp) / dayDuration);

    let equity = [{ date: new Date(startDate), value: initialCapital }];
    let currentEquity = initialCapital;

    for (let i = 1; i <= numberOfDays; i++) {
      const currentDate = new Date(startTimestamp + i * dayDuration);
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        continue;
      }
      const dailyChange = (Math.random() * 4 - 2) / 100;
      currentEquity = currentEquity * (1 + dailyChange);
      equity.push({
        date: currentDate,
        value: currentEquity
      });
    }

    const trades = [];
    let tradeId = 1;
    let position = null;

    for (let i = 5; i < equity.length; i += Math.floor(Math.random() * 10) + 5) {
      if (!position) {
        const entryPrice = equity[i].value * (1 - Math.random() * 0.01);
        const shares = Math.floor(equity[i].value * 0.1 / entryPrice);
        position = {
          id: tradeId++,
          symbol: ['AAPL', 'MSFT', 'GOOG', 'TSLA', 'NVDA'][Math.floor(Math.random() * 5)],
          entryDate: equity[i].date,
          entryPrice,
          shares,
          side: Math.random() > 0.3 ? 'long' : 'short'
        };
      } else {
        const exitPrice = position.entryPrice * (1 + (Math.random() * 0.06 - 0.03) * (position.side === 'long' ? 1 : -1));
        const pnl = (exitPrice - position.entryPrice) * position.shares * (position.side === 'long' ? 1 : -1);
        trades.push({
          ...position,
          exitDate: equity[i].date,
          exitPrice,
          pnl,
          returnPct: (pnl / (position.entryPrice * position.shares)) * 100
        });
        position = null;
      }
    }

    if (position) {
      const exitPrice = position.entryPrice * (1 + (Math.random() * 0.06 - 0.03) * (position.side === 'long' ? 1 : -1));
      const pnl = (exitPrice - position.entryPrice) * position.shares * (position.side === 'long' ? 1 : -1);
      trades.push({
        ...position,
        exitDate: equity[equity.length - 1].date,
        exitPrice,
        pnl,
        returnPct: (pnl / (position.entryPrice * position.shares)) * 100
      });
    }

    const finalEquity = equity[equity.length - 1].value;
    const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);

    const winRate = (winningTrades.length / trades.length) * 100;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.returnPct, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.returnPct, 0) / losingTrades.length : 0;

    let maxDrawdown = 0;
    let peak = initialCapital;

    for (const point of equity) {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = (peak - point.value) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const returns = [];
    for (let i = 1; i < equity.length; i++) {
      returns.push((equity[i].value - equity[i - 1].value) / equity[i - 1].value);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdReturn = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = (avgReturn / stdReturn) * Math.sqrt(252);

    return {
      equity,
      trades,
      stats: {
        initialCapital,
        finalEquity,
        totalReturn,
        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate,
        avgWin,
        avgLoss,
        profitFactor: Math.abs(winningTrades.reduce((sum, t) => sum + t.pnl, 0) / (losingTrades.reduce((sum, t) => sum + t.pnl, 0) || 1)),
        maxDrawdown,
        sharpeRatio
      }
    };
  };

  useEffect(() => {
    if (backtestResults) {
      const equityData = backtestResults.equity;
      const tradesData = backtestResults.trades;

      const equityTrace = {
        x: equityData.map(d => d.date),
        y: equityData.map(d => d.value),
        type: 'scatter',
        mode: 'lines',
        name: 'Strategy Equity',
        line: { color: theme.palette.primary.main, width: 2 }
      };

      const benchmarkData = equityData.map(d => ({
        date: d.date,
        value: initialCapital * (1 + ((d.date - equityData[0].date) / (equityData[equityData.length - 1].date - equityData[0].date)) * 0.08)
      }));

      const benchmarkTrace = {
        x: benchmarkData.map(d => d.date),
        y: benchmarkData.map(d => d.value),
        type: 'scatter',
        mode: 'lines',
        name: 'Benchmark (8% Ann.)',
        line: { color: theme.palette.grey[500], width: 1, dash: 'dash' }
      };

      const entryMarkers = {
        x: tradesData.map(t => t.entryDate),
        y: tradesData.map(t => {
          const equityPoint = equityData.find(e => e.date.getTime() === t.entryDate.getTime());
          return equityPoint ? equityPoint.value : null;
        }),
        mode: 'markers',
        type: 'scatter',
        name: 'Entries',
        marker: {
          color: tradesData.map(t => t.side === 'long' ? theme.palette.success.light : theme.palette.error.light),
          size: 8,
          symbol: tradesData.map(t => t.side === 'long' ? 'triangle-up' : 'triangle-down'),
          line: {
            color: tradesData.map(t => t.side === 'long' ? theme.palette.success.main : theme.palette.error.main),
            width: 1
          }
        },
        hoverinfo: 'text',
        text: tradesData.map(t => `Entry: ${t.side.toUpperCase()} ${t.symbol}<br>Price: $${t.entryPrice.toFixed(2)}<br>Shares: ${t.shares}<br>Date: ${t.entryDate.toLocaleDateString()}`)
      };

      const exitMarkers = {
        x: tradesData.map(t => t.exitDate),
        y: tradesData.map(t => {
          const equityPoint = equityData.find(e => e.date.getTime() === t.exitDate.getTime());
          return equityPoint ? equityPoint.value : null;
        }),
        mode: 'markers',
        type: 'scatter',
        name: 'Exits',
        marker: {
          color: tradesData.map(t => t.pnl > 0 ? theme.palette.success.main : theme.palette.error.main),
          size: 8,
          symbol: tradesData.map(t => t.side === 'long' ? 'triangle-down-open' : 'triangle-up-open'),
          line: {
            color: tradesData.map(t => t.pnl > 0 ? theme.palette.success.dark : theme.palette.error.dark),
            width: 1
          }
        },
        hoverinfo: 'text',
        text: tradesData.map(t => `Exit: ${t.side === 'long' ? 'SELL' : 'COVER'} ${t.symbol}<br>Price: $${t.exitPrice.toFixed(2)}<br>P&L: $${t.pnl.toFixed(2)} (${t.returnPct.toFixed(2)}%)<br>Date: ${t.exitDate.toLocaleDateString()}`)
      };

      setPlotlyData([equityTrace, benchmarkTrace, entryMarkers, exitMarkers]);

      setPlotlyLayout({
        autosize: true,
        margin: { l: 70, r: 30, b: 50, t: 50, pad: 4 },
        xaxis: {
          title: 'Date',
          gridcolor: theme.palette.divider,
          linecolor: theme.palette.text.secondary,
          tickfont: { color: theme.palette.text.secondary }
        },
        yaxis: {
          title: 'Equity ($)',
          gridcolor: theme.palette.divider,
          linecolor: theme.palette.text.secondary,
          tickfont: { color: theme.palette.text.secondary }
        },
        legend: {
          orientation: 'h',
          yanchor: 'bottom',
          y: 1.02,
          xanchor: 'right',
          x: 1,
          font: { color: theme.palette.text.secondary }
        },
        plot_bgcolor: theme.palette.background.paper,
        paper_bgcolor: theme.palette.background.paper,
        font: { color: theme.palette.text.primary },
        hovermode: 'closest'
      });
    }
  }, [backtestResults, theme.palette, initialCapital]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', p: 3 }}>
        {!backtestComplete ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Backtest Configuration
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Select Strategy</InputLabel>
                  <Select
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    label="Select Strategy"
                  >
                    {savedStrategies.map((strategy) => (
                      <MenuItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>                {selectedStrategy && (
                  <Box sx={{ mt: 2, mb: 3 }}>
                    {(() => {
                      const strategy = savedStrategies.find(s => s.id === selectedStrategy);
                      if (!strategy) return null;
                      
                      return (
                        <Paper sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
                            Strategy Details
                          </Typography>
                          
                          {/* Basic Info */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {strategy.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={strategy.category} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={strategy.complexity} 
                                size="small" 
                                color={strategy.complexity === 'Beginner' ? 'success' : strategy.complexity === 'Intermediate' ? 'warning' : 'error'}
                                variant="outlined"
                              />
                              {strategy.type && (
                                <Chip 
                                  label={strategy.type === 'default' ? 'Default' : 'Custom'} 
                                  size="small" 
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>

                          {/* Strategy Configuration */}
                          {strategy.config && (
                            <Box>
                              {/* Trading Instruments */}
                              {strategy.config.symbols && strategy.config.symbols.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                    Trading Instruments:
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                    {strategy.config.symbols.map((symbol, idx) => (
                                      <Chip 
                                        key={idx} 
                                        label={symbol} 
                                        size="small" 
                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* Timeframe */}
                              {strategy.config.timeframe && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                    Timeframe: <span style={{ fontWeight: 400 }}>{strategy.config.timeframe.toUpperCase()}</span>
                                  </Typography>
                                </Box>
                              )}

                              {/* Entry Conditions */}
                              {strategy.config.entry_conditions && strategy.config.entry_conditions.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                    Entry Conditions:
                                  </Typography>
                                  {strategy.config.entry_conditions.map((condition, idx) => (
                                    <Typography key={idx} variant="caption" display="block" sx={{ ml: 1, mt: 0.5, fontSize: '0.7rem' }}>
                                      • {condition.indicator} {condition.comparison.replace(/_/g, ' ')} {condition.value}
                                    </Typography>
                                  ))}
                                </Box>
                              )}

                              {/* Exit Conditions */}
                              {strategy.config.exit_conditions && strategy.config.exit_conditions.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                                    Exit Conditions:
                                  </Typography>
                                  {strategy.config.exit_conditions.map((condition, idx) => (
                                    <Typography key={idx} variant="caption" display="block" sx={{ ml: 1, mt: 0.5, fontSize: '0.7rem' }}>
                                      • {condition.indicator} {condition.comparison.replace(/_/g, ' ')} {condition.value}
                                    </Typography>
                                  ))}
                                </Box>
                              )}

                              {/* Risk Management */}
                              {strategy.config.risk_management && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                                    Risk Management:
                                  </Typography>
                                  <Box sx={{ ml: 1, mt: 0.5 }}>
                                    {strategy.config.risk_management.position_sizing_method && (
                                      <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                                        • Position Sizing: {strategy.config.risk_management.position_sizing_method.replace(/_/g, ' ')}
                                      </Typography>
                                    )}
                                    {strategy.config.risk_management.risk_per_trade && (
                                      <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                                        • Risk per Trade: {(strategy.config.risk_management.risk_per_trade * 100).toFixed(1)}%
                                      </Typography>
                                    )}
                                    {strategy.config.risk_management.stop_loss && (
                                      <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                                        • Stop Loss: {(strategy.config.risk_management.stop_loss * 100).toFixed(1)}%
                                      </Typography>
                                    )}
                                    {strategy.config.risk_management.take_profit && (
                                      <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                                        • Take Profit: {(strategy.config.risk_management.take_profit * 100).toFixed(1)}%
                                      </Typography>
                                    )}
                                    {strategy.config.risk_management.max_position_size && (
                                      <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                                        • Max Position: ${strategy.config.risk_management.max_position_size.toLocaleString()}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              )}

                              {/* Indicators */}
                              {strategy.config.indicators && strategy.config.indicators.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                                    Technical Indicators:
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                    {strategy.config.indicators.map((indicator, idx) => (
                                      <Chip 
                                        key={idx} 
                                        label={`${indicator.name}${indicator.params?.period ? ` (${indicator.params.period})` : ''}`}
                                        size="small" 
                                        color="info"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Paper>
                      );
                    })()}
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Backtest Settings
                </Typography>
                <TextField
                  fullWidth
                  label="Initial Capital"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    inputProps: { min: 1000 }
                  }}
                  margin="normal"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Timeframe</InputLabel>
                  <Select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    label="Timeframe"
                  >
                    {timeframeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 3 }}
                  onClick={runBacktest}
                  disabled={!selectedStrategy || isBacktesting}
                >
                  {isBacktesting ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                      Running Backtest...
                    </>
                  ) : (
                    'Run Backtest'
                  )}
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={8}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <ShowChartIcon sx={{ fontSize: 80, color: theme.palette.primary.light, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Configure and run a backtest
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                    Select a strategy, set the initial capital, timeframe, and date range, then run the backtest to see performance metrics and trade analysis.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Equity Curve
                  </Typography>
                  <Box sx={{ width: '100%', height: 400 }}>
                    <Plot
                      data={plotlyData}
                      layout={plotlyLayout}
                      style={{ width: '100%', height: '100%' }}
                      useResizeHandler={true}
                      config={{ responsive: true, displaylogo: false }}
                    />
                  </Box>
                </Paper>
                <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance Analytics
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Trade Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Total Trades:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {backtestResults.stats.totalTrades}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Winning Trades:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                          {backtestResults.stats.winningTrades} ({backtestResults.stats.winRate.toFixed(1)}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Losing Trades:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                          {backtestResults.stats.losingTrades} ({(100 - backtestResults.stats.winRate).toFixed(1)}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Avg. Win:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                          {backtestResults.stats.avgWin.toFixed(2)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Avg. Loss:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                          {backtestResults.stats.avgLoss.toFixed(2)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Trade History
                  </Typography>
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell>Side</TableCell>
                          <TableCell>Entry Date</TableCell>
                          <TableCell>Entry Price</TableCell>
                          <TableCell>Exit Date</TableCell>
                          <TableCell>Exit Price</TableCell>
                          <TableCell>Shares</TableCell>
                          <TableCell>P&L ($)</TableCell>
                          <TableCell>Return (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backtestResults.trades.map((trade) => (
                          <TableRow
                            key={trade.id}
                            sx={{
                              '&:nth-of-type(odd)': { bgcolor: theme.palette.action.hover },
                              bgcolor: trade.pnl > 0 ? 'rgba(46, 125, 50, 0.04)' : 'rgba(211, 47, 47, 0.04)'
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip
                                  label={trade.symbol}
                                  size="small"
                                  sx={{
                                    bgcolor: theme.palette.primary.main,
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    height: 20
                                  }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: trade.side === 'long' ? theme.palette.success.main : theme.palette.error.main,
                                  fontWeight: 'bold'
                                }}
                              >
                                {trade.side.toUpperCase()}
                              </Typography>
                            </TableCell>
                            <TableCell>{trade.entryDate.toLocaleDateString()}</TableCell>
                            <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                            <TableCell>{trade.exitDate.toLocaleDateString()}</TableCell>
                            <TableCell>${trade.exitPrice.toFixed(2)}</TableCell>
                            <TableCell>{trade.shares}</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: trade.pnl > 0 ? theme.palette.success.main : theme.palette.error.main,
                                  fontWeight: 'bold'
                                }}
                              >
                                {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: trade.returnPct > 0 ? theme.palette.success.main : theme.palette.error.main,
                                  fontWeight: 'bold'
                                }}
                              >
                                {trade.returnPct > 0 ? '+' : ''}{trade.returnPct.toFixed(2)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MonetizationOnIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                          <Typography variant="subtitle2">Total Return</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: backtestResults.stats.totalReturn >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                          {backtestResults.stats.totalReturn >= 0 ? '+' : ''}{backtestResults.stats.totalReturn.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${backtestResults.stats.initialCapital.toFixed(2)} → ${backtestResults.stats.finalEquity.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TrendingUpIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                          <Typography variant="subtitle2">Win Rate</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {backtestResults.stats.winRate.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {backtestResults.stats.winningTrades} / {backtestResults.stats.totalTrades} trades
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TrendingDownIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                          <Typography variant="subtitle2">Max Drawdown</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                          -{backtestResults.stats.maxDrawdown.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Profit Factor: {backtestResults.stats.profitFactor.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AssessmentIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                          <Typography variant="subtitle2">Sharpe Ratio</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {backtestResults.stats.sharpeRatio.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Win: {backtestResults.stats.avgWin.toFixed(2)}% | Avg Loss: {backtestResults.stats.avgLoss.toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h6">
                        {savedStrategies.find(s => s.id === selectedStrategy)?.name} - Backtest Results
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {startDate} to {endDate} ({timeframe})
                      </Typography>
                    </Box>
                    <Box>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={resetBacktest}
                        sx={{ mr: 2 }}
                      >
                        New Backtest
                      </Button>
                      <Button
                        variant="contained"
                        color="accent"
                      >
                        Save Results
                      </Button>
                    </Box>
                  </Paper>                  <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Strategy Summary
                    </Typography>
                    
                    {/* Strategy Details Section */}
                    {(() => {
                      const strategy = savedStrategies.find(s => s.id === selectedStrategy);
                      if (strategy) {
                        return (
                          <Paper sx={{ p: 2, mb: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
                              {strategy.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                              {strategy.description}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                              <Chip label={strategy.category} size="small" color="primary" variant="outlined" />
                              <Chip 
                                label={strategy.complexity} 
                                size="small" 
                                color={strategy.complexity === 'Beginner' ? 'success' : strategy.complexity === 'Intermediate' ? 'warning' : 'error'}
                                variant="outlined"
                              />
                              {strategy.type && (
                                <Chip 
                                  label={strategy.type === 'default' ? 'Default' : 'Custom'} 
                                  size="small" 
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>

                            {/* Configuration Summary */}
                            {strategy.config && (
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                {strategy.config.symbols && strategy.config.symbols.length > 0 && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                      Instruments: {strategy.config.symbols.join(', ')}
                                    </Typography>
                                  </Grid>
                                )}
                                {strategy.config.timeframe && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                      Timeframe: {strategy.config.timeframe.toUpperCase()}
                                    </Typography>
                                  </Grid>
                                )}
                                {strategy.config.entry_conditions && strategy.config.entry_conditions.length > 0 && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                      Entry Rules: {strategy.config.entry_conditions.length} condition(s)
                                    </Typography>
                                  </Grid>
                                )}
                                {strategy.config.exit_conditions && strategy.config.exit_conditions.length > 0 && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                      Exit Rules: {strategy.config.exit_conditions.length} condition(s)
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            )}
                          </Paper>
                        );
                      }
                      return null;
                    })()}

                    <Box sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: backtestResults.stats.totalReturn >= 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                      border: 1,
                      borderColor: backtestResults.stats.totalReturn >= 0 ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.3)'
                    }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Initial Capital:</strong> ${backtestResults.stats.initialCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Final Equity:</strong> ${backtestResults.stats.finalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Absolute Return:</strong> ${(backtestResults.stats.finalEquity - backtestResults.stats.initialCapital).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        <strong>Total Return:</strong> {backtestResults.stats.totalReturn >= 0 ? '+' : ''}{backtestResults.stats.totalReturn.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Paper>
                  <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Risk Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Max Drawdown:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                          {backtestResults.stats.maxDrawdown.toFixed(2)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Sharpe Ratio:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {backtestResults.stats.sharpeRatio.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Profit Factor:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {backtestResults.stats.profitFactor.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Win Rate:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {backtestResults.stats.winRate.toFixed(1)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                  <Paper sx={{ p: 3, borderRadius: 2, flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Recent Trades
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Side</TableCell>
                            <TableCell>P&L</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {backtestResults.trades.slice(-5).reverse().map((trade) => (
                            <TableRow
                              key={trade.id}
                              sx={{
                                bgcolor: trade.pnl > 0 ? 'rgba(46, 125, 50, 0.04)' : 'rgba(211, 47, 47, 0.04)'
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {trade.symbol}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: trade.side === 'long' ? theme.palette.success.main : theme.palette.error.main,
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {trade.side.toUpperCase()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: trade.pnl > 0 ? theme.palette.success.main : theme.palette.error.main,
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Backtest;