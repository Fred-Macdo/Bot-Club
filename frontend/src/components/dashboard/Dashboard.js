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
  CircularProgress
} from '@mui/material';
import { 
  TrendingUp,
  TrendingDown,
  ShowChart,
  Schedule,
  CheckCircle,
  Cancel,
  Error,
  Timeline,
  BarChart,
  Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
        setLoading(false);
      }, 1000);
    };

    fetchData();
  }, []);

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
        icon = <CheckCircle fontSize="small" />;
        break;
      case 'paused':
        color = 'warning';
        icon = <Schedule fontSize="small" />;
        break;
      case 'error':
        color = 'error';
        icon = <Error fontSize="small" />;
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
        return <Notifications sx={{ color: theme.palette.info.main }} />;
      case 'warning':
        return <Error sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <Cancel sx={{ color: theme.palette.error.main }} />;
      default:
        return <Notifications />;
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          Welcome back! Here's an overview of your trading activity
        </Typography>
      </Box>

      {/* Account Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                      }}
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
        
        {/* Alerts and Notifications */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="Alerts & Notifications" 
              action={
                <Button 
                  color="primary"
                  size="small"
                >
                  Clear All
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
                {alerts.map((alert) => (
                  <React.Fragment key={alert.id}>
                    <ListItem
                      sx={{ 
                        py: 1.5, 
                        px: 2, 
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemIcon>
                        {renderAlertIcon(alert.severity)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={alert.message}
                        secondary={`${alert.time} ${alert.date}`}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;