import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  useTheme,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  SwapHoriz as SwapHorizIcon,
  Launch as LaunchIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../router/AuthContext';
import { useStrategy } from '../../context/StrategyContext';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { backtestApi, strategyApi } from '../../api/Client';

const Backtest = () => {
  const theme = useTheme();
  const { strategies, defaultStrategies, loading: strategiesLoading, refreshStrategies } = useStrategy();
  
  // Main state management
  const [currentView, setCurrentView] = useState('main'); // 'main', 'results', 'trades', 'data'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Strategy and configuration state
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [backtestConfig, setBacktestConfig] = useState({
    initial_capital: 100000,
    timeframe: '1d',
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    data_provider: 'alpaca'
  });
  
  // Results state
  const [backtestResult, setBacktestResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deployDialog, setDeployDialog] = useState(false);
  const [deployType, setDeployType] = useState('paper');
  
  // User's previous backtests
  const [userBacktests, setUserBacktests] = useState([]);
  const [defaultStrategiesWithIds, setDefaultStrategiesWithIds] = useState([]);
  
  // Load default strategies with IDs for backtest selection
  useEffect(() => {
    const loadDefaultStrategiesWithIds = async () => {
      try {
        const strategies = await strategyApi.getDefaultStrategiesWithIds();
        console.log('Loaded default strategies with IDs:', strategies);
        setDefaultStrategiesWithIds(strategies);
      } catch (error) {
        console.error('Error loading default strategies with IDs:', error);
      }
    };
    
    loadDefaultStrategiesWithIds();
  }, []);
  
  // Load available strategies on component mount
  useEffect(() => {
    // Refresh strategies when component mounts
    refreshStrategies();
    loadUserBacktests();
  }, [refreshStrategies]);
  
  // Combine user strategies and default strategies for dropdown
  const availableStrategies = useMemo(() => {
    const combinedStrategies = [];
    
    console.log('Raw strategies from context:', strategies);
    console.log('Raw defaultStrategiesWithIds:', defaultStrategiesWithIds);
    
    // Add user's custom strategies
    strategies.forEach(strategy => {
      const strategyId = String(strategy.id || strategy._id);
      console.log('Processing custom strategy:', strategy.name, 'ID:', strategyId);
      combinedStrategies.push({
        id: strategyId,
        name: strategy.name,
        description: strategy.description,
        type: 'custom',
        is_active: strategy.is_active
      });
    });
    
    // Add default strategies with their proper IDs
    defaultStrategiesWithIds.forEach(strategy => {
      console.log('Processing default strategy with ID:', strategy.name, 'ID:', strategy.id);
      combinedStrategies.push({
        id: strategy.id,
        name: strategy.name,
        description: strategy.description,
        type: 'default',
        is_active: true
      });
    });
    
    console.log('Final combined strategies for backtest:', combinedStrategies);
    return combinedStrategies;
  }, [strategies, defaultStrategiesWithIds]);
  
  const loadUserBacktests = async () => {
    try {
      const backtests = await backtestApi.getUserBacktests();
      setUserBacktests(backtests);
    } catch (err) {
      console.error('Error loading user backtests:', err);
    }
  };
  
  const handleRunBacktest = async () => {
    if (!selectedStrategy) {
      setError('Please select a strategy');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Running backtest with strategy ID:', selectedStrategy);
      console.log('Available strategies:', availableStrategies);
      console.log('Default strategies with IDs:', defaultStrategiesWithIds);
      console.log('Selected strategy type:', typeof selectedStrategy);
      console.log('Strategy ID for backtest request:', selectedStrategy);
      
      const response = await backtestApi.runBacktest({
        strategy_id: selectedStrategy,
        ...backtestConfig
      });
      
      setBacktestResult(response);
      setCurrentView('results');
      loadUserBacktests(); // Refresh user backtests list
    } catch (err) {
      console.error('Error running backtest:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeployStrategy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/backtest/deploy/${selectedStrategy}?deploy_type=${deployType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to deploy strategy');
      }
      
      setDeployDialog(false);
      setError(null);
      // Show success message
      alert(`Strategy deployed to ${deployType} trading successfully!`);
    } catch (err) {
      console.error('Error deploying strategy:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate equity chart data
  const equityChartData = useMemo(() => {
    if (!backtestResult?.equity_curve?.length) return null;
    
    const dates = backtestResult.equity_curve.map(point => point.date);
    const totalEquity = backtestResult.equity_curve.map(point => point.total_equity);
    const cashBalance = backtestResult.equity_curve.map(point => point.cash_balance);
    const investedCapital = backtestResult.equity_curve.map(point => point.invested_capital);
    
    // Add trade markers
    const buyTrades = backtestResult.trades.filter(trade => trade.side === 'long').map(trade => ({
      x: trade.entry_date,
      y: backtestResult.equity_curve.find(point => point.date === trade.entry_date)?.total_equity || 0
    }));
    
    const sellTrades = backtestResult.trades.filter(trade => trade.side === 'long').map(trade => ({
      x: trade.exit_date,
      y: backtestResult.equity_curve.find(point => point.date === trade.exit_date)?.total_equity || 0
    }));
    
    return {
      data: [
        {
          x: dates,
          y: totalEquity,
          type: 'scatter',
          mode: 'lines',
          name: 'Total Equity',
          line: { color: theme.palette.primary.main, width: 3 }
        },
        {
          x: dates,
          y: cashBalance,
          type: 'scatter',
          mode: 'lines',
          name: 'Cash Balance',
          line: { color: theme.palette.secondary.main, width: 2 }
        },
        {
          x: dates,
          y: investedCapital,
          type: 'scatter',
          mode: 'lines',
          name: 'Invested Capital',
          line: { color: theme.palette.info.main, width: 2 }
        },
        {
          x: buyTrades.map(t => t.x),
          y: buyTrades.map(t => t.y),
          type: 'scatter',
          mode: 'markers',
          name: 'Buy Trades',
          marker: { 
            symbol: 'triangle-up',
            size: 10,
            color: theme.palette.success.main
          }
        },
        {
          x: sellTrades.map(t => t.x),
          y: sellTrades.map(t => t.y),
          type: 'scatter',
          mode: 'markers',
          name: 'Sell Trades',
          marker: { 
            symbol: 'triangle-down',
            size: 10,
            color: theme.palette.error.main
          }
        }
      ],
      layout: {
        title: 'Portfolio Equity Curve',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Value ($)' },
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: { color: theme.palette.text.primary },
        showlegend: true,
        legend: { x: 0.02, y: 0.98 }
      }
    };
  }, [backtestResult, theme]);
  
  // Main configuration view
  const renderMainView = () => (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
        Strategy Backtest
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Backtest Configuration
            </Typography>
            
            <Grid container spacing={3}>
              {/* Strategy Selection */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Select Strategy"
                  value={selectedStrategy}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    console.log('Strategy selected - Raw value:', selectedValue, typeof selectedValue);
                    const foundStrategy = availableStrategies.find(s => s.id === selectedValue);
                    console.log('Found strategy object:', foundStrategy);
                    setSelectedStrategy(selectedValue);
                  }}
                  disabled={strategiesLoading}
                  helperText={strategiesLoading ? "Loading strategies..." : `${availableStrategies.length} strategies available`}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected) {
                        return <Typography color="textSecondary"></Typography>;
                      }
                      const strategy = availableStrategies.find(s => s.id === selected);
                      return strategy ? strategy.name : '';
                    }
                  }}
                >
                  <MenuItem value="">
                    <Typography color="textSecondary">Choose a strategy...</Typography>
                  </MenuItem>
                  {availableStrategies.map((strategy) => {
                    
                    return (
                      <MenuItem key={strategy.id} value={strategy.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>{strategy.name}</Typography>
                          <Chip 
                            label={strategy.type} 
                            size="small" 
                            color={strategy.type === 'custom' ? 'primary' : 'secondary'}
                          />
                        </Box>
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Grid>
              
              {/* Configuration Fields */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Initial Capital ($)"
                  type="number"
                  value={backtestConfig.initial_capital}
                  onChange={(e) => setBacktestConfig(prev => ({
                    ...prev,
                    initial_capital: parseFloat(e.target.value)
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Timeframe"
                  value={backtestConfig.timeframe}
                  onChange={(e) => setBacktestConfig(prev => ({
                    ...prev,
                    timeframe: e.target.value
                  }))}
                >
                  <MenuItem value="1m">1 Minute</MenuItem>
                  <MenuItem value="5m">5 Minutes</MenuItem>
                  <MenuItem value="15m">15 Minutes</MenuItem>
                  <MenuItem value="1h">1 Hour</MenuItem>
                  <MenuItem value="1d">1 Day</MenuItem>
                  <MenuItem value="1w">1 Week</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={backtestConfig.start_date}
                  onChange={(e) => setBacktestConfig(prev => ({
                    ...prev,
                    start_date: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={backtestConfig.end_date}
                  onChange={(e) => setBacktestConfig(prev => ({
                    ...prev,
                    end_date: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Data Provider"
                  value={backtestConfig.data_provider}
                  onChange={(e) => setBacktestConfig(prev => ({
                    ...prev,
                    data_provider: e.target.value
                  }))}
                >
                  <MenuItem value="alpaca">Alpaca</MenuItem>
                  <MenuItem value="polygon">Polygon</MenuItem>
                  <MenuItem value="yahoo">Yahoo Finance</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                onClick={handleRunBacktest}
                disabled={loading || !selectedStrategy}
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Running Backtest...' : 'Run Backtest'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Previous Backtests */}
        <Grid xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Backtests
            </Typography>
            
            {userBacktests.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No previous backtests found
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {userBacktests.slice(0, 5).map((backtest) => (
                  <Card key={backtest.id} sx={{ mb: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {backtest.strategy_name || 'Unnamed Strategy'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {backtest.start_date} - {backtest.end_date}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={`${backtest.total_return.toFixed(2)}%`}
                          size="small"
                          color={backtest.total_return >= 0 ? 'success' : 'error'}
                        />
                        <Chip 
                          label={`${backtest.total_trades} trades`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
  
  // Results view with tabs
  const renderResultsView = () => (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setCurrentView('main')}
        >
          Back to Configuration
        </Button>
        <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
          Backtest Results
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Performance Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: backtestResult?.stats?.total_return >= 0 ? theme.palette.success.light : theme.palette.error.light }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Return</Typography>
              <Typography variant="h4">{backtestResult?.stats?.total_return?.toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sharpe Ratio</Typography>
              <Typography variant="h4">{backtestResult?.stats?.sharpe_ratio?.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Max Drawdown</Typography>
              <Typography variant="h4" color="error">{backtestResult?.stats?.max_drawdown?.toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Win Rate</Typography>
              <Typography variant="h4">{backtestResult?.stats?.win_rate?.toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="backtest results tabs"
        >
          <Tab label="Overview" icon={<AssessmentIcon />} />
          <Tab label="Equity Chart" icon={<TimelineIcon />} />
          <Tab label="Trades" icon={<SwapHorizIcon />} />
          <Tab label="Data Analysis" icon={<InfoIcon />} />
        </Tabs>
      </Paper>
      
      {/* Tab Content */}
      {activeTab === 0 && renderOverviewTab()}
      {activeTab === 1 && renderEquityChartTab()}
      {activeTab === 2 && renderTradesTab()}
      {activeTab === 3 && renderDataAnalysisTab()}
      
      {/* Deploy Strategy Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<LaunchIcon />}
          onClick={() => setDeployDialog(true)}
          size="large"
        >
          Deploy Strategy to Trading
        </Button>
      </Box>
    </Container>
  );
  
  const renderOverviewTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Performance Statistics</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Initial Capital</TableCell>
                <TableCell>${backtestResult?.stats?.initial_capital?.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Final Equity</TableCell>
                <TableCell>${backtestResult?.stats?.final_equity?.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Return</TableCell>
                <TableCell sx={{ color: backtestResult?.stats?.total_return >= 0 ? 'success.main' : 'error.main' }}>
                  {backtestResult?.stats?.total_return?.toFixed(2)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sharpe Ratio</TableCell>
                <TableCell>{backtestResult?.stats?.sharpe_ratio?.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Maximum Drawdown</TableCell>
                <TableCell sx={{ color: 'error.main' }}>{backtestResult?.stats?.max_drawdown?.toFixed(2)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
        <Grid item xs={12} md={6}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Total Trades</TableCell>
                <TableCell>{backtestResult?.stats?.total_trades}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Winning Trades</TableCell>
                <TableCell sx={{ color: 'success.main' }}>{backtestResult?.stats?.winning_trades}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Losing Trades</TableCell>
                <TableCell sx={{ color: 'error.main' }}>{backtestResult?.stats?.losing_trades}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Win Rate</TableCell>
                <TableCell>{backtestResult?.stats?.win_rate?.toFixed(2)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Profit Factor</TableCell>
                <TableCell>{backtestResult?.stats?.profit_factor?.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </Paper>
  );
  
  const renderEquityChartTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Portfolio Equity Curve</Typography>
      {equityChartData ? (
        <Plot
          data={equityChartData.data}
          layout={{
            ...equityChartData.layout,
            width: '100%',
            height: 500,
            autosize: true
          }}
          style={{ width: '100%', height: '500px' }}
          useResizeHandler={true}
        />
      ) : (
        <Typography>No equity data available</Typography>
      )}
    </Paper>
  );
  
  const renderTradesTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Trade History</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Entry Date</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Exit Date</TableCell>
              <TableCell>Exit Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>P&L</TableCell>
              <TableCell>Return %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {backtestResult?.trades?.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{trade.id}</TableCell>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>
                  <Chip 
                    label={trade.side.toUpperCase()}
                    size="small"
                    color={trade.side === 'long' ? 'primary' : 'secondary'}
                  />
                </TableCell>
                <TableCell>{trade.entry_date}</TableCell>
                <TableCell>${trade.entry_price?.toFixed(2)}</TableCell>
                <TableCell>{trade.exit_date}</TableCell>
                <TableCell>${trade.exit_price?.toFixed(2)}</TableCell>
                <TableCell>{trade.quantity}</TableCell>
                <TableCell sx={{ color: trade.pnl >= 0 ? 'success.main' : 'error.main' }}>
                  ${trade.pnl?.toFixed(2)}
                </TableCell>
                <TableCell sx={{ color: trade.return_pct >= 0 ? 'success.main' : 'error.main' }}>
                  {trade.return_pct?.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
  
  const renderDataAnalysisTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Data Analysis</Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        OHLCV data with indicators showing trigger points for trades
      </Typography>
      
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Open</TableCell>
              <TableCell>High</TableCell>
              <TableCell>Low</TableCell>
              <TableCell>Close</TableCell>
              <TableCell>Volume</TableCell>
              <TableCell>Indicator</TableCell>
              <TableCell>Indicator Prev</TableCell>
              <TableCell>Signal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {backtestResult?.data_analysis?.map((row, index) => (
              <TableRow 
                key={index}
                sx={{ 
                  backgroundColor: row.has_signal ? theme.palette.action.hover : 'inherit'
                }}
              >
                <TableCell>{row.date}</TableCell>
                <TableCell>${row.open?.toFixed(2)}</TableCell>
                <TableCell>${row.high?.toFixed(2)}</TableCell>
                <TableCell>${row.low?.toFixed(2)}</TableCell>
                <TableCell>${row.close?.toFixed(2)}</TableCell>
                <TableCell>{row.volume?.toLocaleString()}</TableCell>
                <TableCell>{row.indicator?.toFixed(4)}</TableCell>
                <TableCell>{row.indicator_prev?.toFixed(4)}</TableCell>
                <TableCell>
                  {row.signal && (
                    <Chip 
                      label={row.signal.toUpperCase()}
                      size="small"
                      color={row.signal === 'buy' ? 'success' : 'error'}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="xl">
        {/* FIX: Remove the "item" prop from all <Grid> components. */}
        {/* The 'xs', 'md', etc. props should be on the Grid component directly. */}
        <Grid container spacing={3}>
          <Grid xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Backtest Configuration
              </Typography>
              
              <Grid container spacing={3}>
                {/* Strategy Selection */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Select Strategy"
                    value={selectedStrategy}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      console.log('Strategy selected - Raw value:', selectedValue, typeof selectedValue);
                      const foundStrategy = availableStrategies.find(s => s.id === selectedValue);
                      console.log('Found strategy object:', foundStrategy);
                      setSelectedStrategy(selectedValue);
                    }}
                    disabled={strategiesLoading}
                    helperText={strategiesLoading ? "Loading strategies..." : `${availableStrategies.length} strategies available`}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (!selected) {
                          return <Typography color="textSecondary"></Typography>;
                        }
                        const strategy = availableStrategies.find(s => s.id === selected);
                        return strategy ? strategy.name : '';
                      }
                    }}
                  >
                    <MenuItem value="">
                      <Typography color="textSecondary">Choose a strategy...</Typography>
                    </MenuItem>
                    {availableStrategies.map((strategy) => {
                      
                      return (
                        <MenuItem key={strategy.id} value={strategy.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{strategy.name}</Typography>
                            <Chip 
                              label={strategy.type} 
                              size="small" 
                              color={strategy.type === 'custom' ? 'primary' : 'secondary'}
                            />
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Grid>
                
                {/* Configuration Fields */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Initial Capital ($)"
                    type="number"
                    value={backtestConfig.initial_capital}
                    onChange={(e) => setBacktestConfig(prev => ({
                      ...prev,
                      initial_capital: parseFloat(e.target.value)
                    }))}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Timeframe"
                    value={backtestConfig.timeframe}
                    onChange={(e) => setBacktestConfig(prev => ({
                      ...prev,
                      timeframe: e.target.value
                    }))}
                  >
                    <MenuItem value="1m">1 Minute</MenuItem>
                    <MenuItem value="5m">5 Minutes</MenuItem>
                    <MenuItem value="15m">15 Minutes</MenuItem>
                    <MenuItem value="1h">1 Hour</MenuItem>
                    <MenuItem value="1d">1 Day</MenuItem>
                    <MenuItem value="1w">1 Week</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={backtestConfig.start_date}
                    onChange={(e) => setBacktestConfig(prev => ({
                      ...prev,
                      start_date: e.target.value
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={backtestConfig.end_date}
                    onChange={(e) => setBacktestConfig(prev => ({
                      ...prev,
                      end_date: e.target.value
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Data Provider"
                    value={backtestConfig.data_provider}
                    onChange={(e) => setBacktestConfig(prev => ({
                      ...prev,
                      data_provider: e.target.value
                    }))}
                  >
                    <MenuItem value="alpaca">Alpaca</MenuItem>
                    <MenuItem value="polygon">Polygon</MenuItem>
                    <MenuItem value="yahoo">Yahoo Finance</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                  onClick={handleRunBacktest}
                  disabled={loading || !selectedStrategy}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Running Backtest...' : 'Run Backtest'}
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Previous Backtests */}
          <Grid xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Backtests
              </Typography>
              
              {userBacktests.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No previous backtests found
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {userBacktests.slice(0, 5).map((backtest) => (
                    <Card key={backtest.id} sx={{ mb: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {backtest.strategy_name || 'Unnamed Strategy'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {backtest.start_date} - {backtest.end_date}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip 
                            label={`${backtest.total_return.toFixed(2)}%`}
                            size="small"
                            color={backtest.total_return >= 0 ? 'success' : 'error'}
                          />
                          <Chip 
                            label={`${backtest.total_trades} trades`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Backtest;
