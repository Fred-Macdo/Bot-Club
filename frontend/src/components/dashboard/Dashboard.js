import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  CircularProgress,
  Drawer,
  IconButton
} from '@mui/material';
import { 
  TrendingUp,
  TrendingDown,
  ShowChart,
  Schedule,
  CheckCircle as CheckCircleIcon,
  Cancel,
  Error as ErrorIcon,
  Timeline,
  BarChart,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js'; // Import Plotly

// Mock data - in a real app, you would fetch this from your API
const mockStrategies = [
  { 
    id: 1, 
    name: 'EMA Crossover Strategy', 
    status: 'active', 
    performance: '+12.4%', 
    positive: true,
    lastRun: '2 hours ago'
  },
  { 
    id: 2, 
    name: 'RSI Mean Reversion', 
    status: 'active', 
    performance: '+8.7%', 
    positive: true,
    lastRun: '5 hours ago'
  },
  { 
    id: 3, 
    name: 'Bollinger Bands Strategy', 
    status: 'paused', 
    performance: '-2.3%', 
    positive: false,
    lastRun: '1 day ago'
  },
  { 
    id: 4, 
    name: 'MACD Strategy', 
    status: 'active', 
    performance: '+5.1%', 
    positive: true,
    lastRun: '4 hours ago'
  }
];

const mockTrades = [
  { 
    id: 1, 
    symbol: 'AAPL', 
    type: 'buy', 
    quantity: 5, 
    price: 185.42, 
    time: '10:32 AM', 
    date: 'Today',
    strategy: 'EMA Crossover Strategy'
  },
  { 
    id: 2, 
    symbol: 'TSLA', 
    type: 'sell', 
    quantity: 2, 
    price: 242.15, 
    time: '9:45 AM', 
    date: 'Today',
    strategy: 'RSI Mean Reversion'
  },
  { 
    id: 3, 
    symbol: 'MSFT', 
    type: 'buy', 
    quantity: 3, 
    price: 398.10, 
    time: '3:15 PM', 
    date: 'Yesterday',
    strategy: 'EMA Crossover Strategy'
  },
  { 
    id: 4, 
    symbol: 'NVDA', 
    type: 'buy', 
    quantity: 1, 
    price: 924.87, 
    time: '2:30 PM', 
    date: 'Yesterday',
    strategy: 'RSI Mean Reversion'
  }
];

const mockAlerts = [
  {
    id: 1,
    message: 'EMA Crossover Strategy executed a buy for AAPL',
    time: '10:32 AM',
    date: 'Today',
    severity: 'info'
  },
  {
    id: 2,
    message: 'Stop loss triggered for TSLA position',
    time: '9:45 AM',
    date: 'Today',
    severity: 'warning'
  },
  {
    id: 3,
    message: 'RSI Mean Reversion strategy performance below threshold',
    time: '8:00 AM',
    date: 'Today',
    severity: 'error'
  }
];

const mockAccountSummary = {
  balance: 10425.68,
  portfolioValue: 15782.32,
  totalProfit: 1258.45,
  profitPercentage: 8.65,
  openPositions: 5
};

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [accountSummary, setAccountSummary] = useState({});
  const [notificationsOpen, setNotificationsOpen] = useState(false);
    
  // New state for equity curves
  const [accountEquityData, setAccountEquityData] = useState([]);
  const [strategyEquityData, setStrategyEquityData] = useState({});
  const [accountPlotData, setAccountPlotData] = useState([]);
  const [accountPlotLayout, setAccountPlotLayout] = useState({});
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // Simulating data loading
  useEffect(() => {
    const fetchData = async () => {
      // In a real application, these would be API calls
      // await fetchStrategies(), fetchTrades(), etc.
      
      // Simulating API delay
      setTimeout(() => {
        setStrategies(mockStrategies);
        setRecentTrades(mockTrades);
        setAlerts(mockAlerts);
        setAccountSummary(mockAccountSummary);
        
        // Generate mock equity data
        const mockEquityData = generateMockEquityData();
        setAccountEquityData(mockEquityData);
        
        // Generate mock equity data for each strategy
        const strategyData = {};
        mockStrategies.forEach(strategy => {
          strategyData[strategy.id] = generateMockEquityData(
            10000,  // Initial value
            60,     // Number of days
            strategy.positive ? 0.8 : 0.3  // Trend factor (higher for positive performing strategies)
          );
        });
        setStrategyEquityData(strategyData);
        
        setLoading(false);
      }, 1000);
    };

    fetchData();
  }, []);

    
  // Generate account equity curve data when accountEquityData changes
  useEffect(() => {
    if (accountEquityData.length > 0) {
      const equityTrace = {
        x: accountEquityData.map(d => d.date),
        y: accountEquityData.map(d => d.value),
        type: 'scatter',
        mode: 'lines',
        name: 'Account Equity',
        line: { color: theme.palette.primary.main, width: 2 }
      };
      
      // Calculate 7-day moving average for smoother trend line
      const movingAvgData = calculateMovingAverage(accountEquityData, 7);
      const movingAvgTrace = {
        x: movingAvgData.map(d => d.date),
        y: movingAvgData.map(d => d.value),
        type: 'scatter',
        mode: 'lines',
        name: '7-Day MA',
        line: { color: theme.palette.secondary.main, width: 1.5, dash: 'dot' }
      };
      
      setAccountPlotData([equityTrace, movingAvgTrace]);
      
      setAccountPlotLayout({
        autosize: true,
        margin: { l: 50, r: 20, b: 40, t: 10, pad: 0 },
        xaxis: {
          showgrid: false,
          zeroline: false,
          showticklabels: true,
          gridcolor: theme.palette.divider,
          linecolor: theme.palette.text.secondary,
          tickfont: { color: theme.palette.text.secondary, size: 10 }
        },
        yaxis: {
          showgrid: true,
          zeroline: false,
          gridcolor: theme.palette.divider,
          linecolor: theme.palette.text.secondary,
          tickfont: { color: theme.palette.text.secondary, size: 10 },
          tickformat: '$,.0f'
        },
        showlegend: false,
        plot_bgcolor: theme.palette.background.paper,
        paper_bgcolor: theme.palette.background.paper,
        font: { color: theme.palette.text.primary },
        hovermode: 'closest'
      });
    }
  }, [accountEquityData, theme.palette]);

  // Function to generate mock equity data
  const generateMockEquityData = (initialValue = 10000, days = 90, trendFactor = 0.6) => {
    const data = [];
    let currentValue = initialValue;
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      // Random daily change with trend bias
      const randomFactor = Math.random();
      const dailyChange = (randomFactor > trendFactor) 
        ? -(Math.random() * 2) // Negative day
        : (Math.random() * 2.5); // Positive day (slightly higher to create uptrend)
        
      currentValue = currentValue * (1 + (dailyChange / 100));
      
      data.push({
        date: date,
        value: currentValue
      });
    }
    
    return data;
  };
  
  // Function to calculate moving average
  const calculateMovingAverage = (data, period) => {
    if (!data || data.length < period) return [];
    
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].value;
      }
      result.push({
        date: data[i].date,
        value: sum / period
      });
    }
    
    return result;
  };
  
  // Function to create plot layout for strategy thumbnails
  const getStrategyPlotLayout = () => {
    return {
      autosize: true,
      margin: { l: 30, r: 10, b: 25, t: 25, pad: 0 },
      xaxis: {
        showgrid: false,
        zeroline: false,
        showticklabels: false
      },
      yaxis: {
        showgrid: false,
        zeroline: false,
        showticklabels: false
      },
      showlegend: false,
      plot_bgcolor: theme.palette.background.paper,
      paper_bgcolor: theme.palette.background.paper,
      font: { color: theme.palette.text.primary },
      hovermode: false
    };
  };

  const handleNotificationsToggle = () => {
    setNotificationsOpen(!notificationsOpen);
  };
  
  // New handler for strategy click
  const handleStrategyClick = (strategyId) => {
    navigate(`/strategy/${strategyId}`);
  };

  const handleNavigateToStrategy = () => {
    navigate('/strategy-builder');
  };

  // Function to render status chip
  const renderStatusChip = (status) => {
    let color = 'default';
    let icon = null;

    switch (status) {
      case 'active':
        color = 'success';
        icon = <CheckCircleIcon fontSize="small" />;
        break;
      case 'paused':
        color = 'warning';
        icon = <Schedule fontSize="small" />;
        break;
      case 'error':
        color = 'error';
        icon = <ErrorIcon fontSize="small" />;
        break;
      default:
        icon = <Cancel fontSize="small" />;
    }

    return (
      <Chip 
        icon={icon}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={color}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  // Function to render alert severity icon
  const renderAlertIcon = (severity) => {
    switch (severity) {
      case 'info':
        return <InfoIcon sx={{ color: theme.palette.info.main }} />;
      case 'warning':
        return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 64px)' 
        }}
      >
        <CircularProgress sx={{ color: theme.palette.accent.main }} />
      </Box>
    );
  }

  return (
    <Container  sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Welcome back! Here's an overview of your trading activity
          </Typography>
        </Box>
        <IconButton
          color="primary"
          onClick={handleNotificationsToggle}
          sx={{ 
            border: `1px solid ${theme.palette.divider}`, 
            borderRadius: '8px', 
            p: 1,
            bgcolor: notificationsOpen ? theme.palette.action.selected : 'transparent',
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            }
          }}
        >
          <NotificationsIcon />
        </IconButton>
      </Box>

      {/* Account Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: theme.palette.primary.main,
              color: theme.palette.secondary.main,
              height: '100%',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>Account Balance</Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
              ${accountSummary.balance.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.accent.main }}>
              Available for trading
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: theme.palette.text.primary }}>
              Portfolio Value
            </Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: theme.palette.primary.main }}>
              ${accountSummary.portfolioValue.toLocaleString()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {accountSummary.profitPercentage >= 0 ? (
                <TrendingUp fontSize="small" sx={{ color: theme.palette.success.main, mr: 0.5 }} />
              ) : (
                <TrendingDown fontSize="small" sx={{ color: theme.palette.error.main, mr: 0.5 }} />
              )}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: accountSummary.profitPercentage >= 0 ? 
                    theme.palette.success.main : 
                    theme.palette.error.main 
                }}
              >
                {accountSummary.profitPercentage >= 0 ? '+' : ''}
                {accountSummary.profitPercentage}% all time
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: theme.palette.text.primary }}>
              Total Profit/Loss
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 1, 
                fontWeight: 700, 
                color: accountSummary.totalProfit >= 0 ? 
                  theme.palette.success.main : 
                  theme.palette.error.main 
              }}
            >
              {accountSummary.totalProfit >= 0 ? '+' : ''}${accountSummary.totalProfit.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Since account creation
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: theme.palette.text.primary }}>
              Open Positions
            </Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: theme.palette.primary.main }}>
              {accountSummary.openPositions}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Active trades
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Equity Charts Grid - Main account + strategy thumbnails */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Main Account Equity Chart - Full Width */}
        <Grid item xs={12} md={12}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Account Performance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button 
                  size="small" 
                  onClick={() => navigate('/performance')}
                  endIcon={<ZoomInIcon />}
                >
                  Detailed View
                </Button>
              </Box>
            </Box>
            <Box sx={{ height: 300 }}>
              <Plot
                data={accountPlotData}
                layout={accountPlotLayout}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
                config={{ displayModeBar: false, responsive: true }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Strategy Equity Curves (1x4 Grid of 4 strategies) - Full Width, below account chart */}
        <Grid item xs={12} md={12}>
          <Grid container spacing={2}>
            {strategies.slice(0, 4).map((strategy, index) => (
              <Grid item xs={12} sm={6} md={3} key={strategy.id} sx={{ height: 150 }}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    height: '100%', 
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handleStrategyClick(strategy.id)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexShrink: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem' }} noWrap>
                      {strategy.name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: strategy.positive ? theme.palette.success.main : theme.palette.error.main 
                      }}
                    >
                      {strategy.performance}
                    </Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1, height: 'calc(100% - 24px)' }}>
                    {strategyEquityData[strategy.id] && (
                      <Plot
                        data={[
                          {
                            x: strategyEquityData[strategy.id].map(d => d.date),
                            y: strategyEquityData[strategy.id].map(d => d.value),
                            type: 'scatter',
                            mode: 'lines',
                            line: { 
                              color: strategy.positive ? theme.palette.success.main : theme.palette.error.main, 
                              width: 1.5 
                            }
                          }
                        ]}
                        layout={getStrategyPlotLayout()}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                        config={{ displayModeBar: false, responsive: true, staticPlot: true }}
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Strategies */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader 
              title="Active Strategies" 
              action={
                <Button 
                  variant="contained" 
                  color="primary"
                  size="small"
                  onClick={handleNavigateToStrategy}
                >
                  Build Strategy
                </Button>
              }
              sx={{ 
                pb: 1,
                '& .MuiCardHeader-title': { 
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }
              }}
            />
            <Divider />
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <List>
                {strategies.map((strategy) => (
                  <React.Fragment key={strategy.id}>
                    <ListItem
                      sx={{ 
                        py: 1.5, 
                        px: 2, 
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleStrategyClick(strategy.id)}
                    >
                      <ListItemIcon>
                        <ShowChart 
                          sx={{ 
                            color: strategy.positive ? 
                              theme.palette.success.main : 
                              theme.palette.error.main 
                          }} 
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={strategy.name}
                        secondary={`Last run: ${strategy.lastRun}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: strategy.positive ? 
                              theme.palette.success.main : 
                              theme.palette.error.main 
                          }}
                        >
                          {strategy.performance}
                        </Typography>
                        {renderStatusChip(strategy.status)}
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Trades */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader 
              title="Recent Trades" 
              action={
                <Button 
                  color="primary"
                  size="small"
                >
                  View All
                </Button>
              }
              sx={{ 
                pb: 1,
                '& .MuiCardHeader-title': { 
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }
              }}
            />
            <Divider />
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <List>
                {recentTrades.map((trade) => (
                  <React.Fragment key={trade.id}>
                    <ListItem
                      sx={{ 
                        py: 1.5, 
                        px: 2, 
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemIcon>
                        {trade.type === 'buy' ? (
                          <TrendingUp sx={{ color: theme.palette.success.main }} />
                        ) : (
                          <TrendingDown sx={{ color: theme.palette.error.main }} />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 600 }}>{trade.symbol}</Typography>
                            <Chip 
                              label={trade.type.toUpperCase()} 
                              size="small"
                              sx={{ 
                                ml: 1, 
                                bgcolor: trade.type === 'buy' ? 
                                  'rgba(46, 125, 50, 0.1)' : 
                                  'rgba(211, 47, 47, 0.1)',
                                color: trade.type === 'buy' ? 
                                  theme.palette.success.main : 
                                  theme.palette.error.main,
                                fontWeight: 600
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {trade.quantity} shares @ ${trade.price} • {trade.time} {trade.date}
                          </Typography>
                        }
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem'
                        }}
                      >
                        {trade.strategy}
                      </Typography>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notifications Sidebar (Drawer) */}
      <Drawer
        anchor="right"
        open={notificationsOpen}
        onClose={handleNotificationsToggle}
        PaperProps={{
          sx: {
            width: { xs: '90%', sm: 360, md: 400 },
            p: 2,
            boxSizing: 'border-box',
            borderTopLeftRadius: theme.shape.borderRadius * 2,
            borderBottomLeftRadius: theme.shape.borderRadius * 2,
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            Notifications
          </Typography>
          <Button
            color="primary"
            size="small"
            onClick={() => {
              setAlerts([]);
              handleNotificationsToggle();
            }}
          >
            Clear All
          </Button>
        </Box>
        <Divider sx={{ mb: 1 }} />
        {alerts && alerts.length > 0 ? (
          <List sx={{ p: 0, overflowY: 'auto' }}>
            {alerts.map((alert) => (
              <React.Fragment key={alert.id}>
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 0.5,
                    alignItems: 'flex-start',
                    '&:hover': { bgcolor: theme.palette.action.hover }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    {renderAlertIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.message}
                    secondary={`${alert.time} • ${alert.date}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500, mb: 0.5 }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
                <Divider component="li" variant="inset" sx={{ ml: '36px' }} />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            No new notifications.
          </Typography>
        )}
      </Drawer>
    </Container>
  );
};

export default Dashboard;