import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Grid, 
  IconButton, 
  Typography, 
  Tabs, 
  Tab, 
  Toolbar, 
  useMediaQuery, 
  useTheme, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Menu as MenuIcon, 
  Check as CheckIcon, 
  ChevronRight, 
  Code, 
  Settings, 
  Shield, 
  Terminal, 
  TrendingUp, 
  Zap
} from 'lucide-react';

// Custom styled components
const StyledCard = styled(Card)(({ theme, popular }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[4]
  },
  ...(popular && {
    border: `2px solid ${theme.palette.primary.main}`,
    position: 'relative',
    zIndex: 1,
    transform: 'scale(1.05)',
    '&:hover': {
      transform: 'translateY(-8px) scale(1.05)'
    }
  })
}));

const FeatureIcon = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: 'rgba(13, 55, 42, 0.1)',
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main
}));

const PopularTag = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: -15,
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#d4c892',
  color: '#0d372a',
  padding: '6px 12px',
  borderRadius: 16,
  fontWeight: 'bold',
  zIndex: 1,
  fontSize: '0.75rem'
}));

// Main component
const LandingPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Custom theme colors that match the provided index.html
  const customColors = {
    primary: '#0d372a',
    secondary: '#f5edd8',
    accent: '#d4c892',
    light: '#e6e6e6',
    white: '#fff'
  };

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Toggle mobile drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // Example trading strategies
  const strategiesData = [
    // Stocks
    [
      {
        name: "Moving Average Crossover",
        description: "A strategy that buys when the short-term moving average crosses above the long-term moving average.",
        indicators: ["EMA", "SMA"],
        performance: "+14.2%"
      },
      {
        name: "RSI Reversal",
        description: "Takes advantage of oversold conditions when RSI dips below 30, waiting for reversal signals.",
        indicators: ["RSI", "Volume"],
        performance: "+9.7%"
      },
      {
        name: "MACD Momentum",
        description: "Captures momentum by analyzing the MACD histogram's relationship to its signal line.",
        indicators: ["MACD", "SMA"],
        performance: "+12.5%"
      }
    ],
    // Crypto
    [
      {
        name: "Bitcoin Volatility Swing",
        description: "Capitalizes on BTC's volatility with Bollinger Bands and RSI to identify overbought/oversold conditions.",
        indicators: ["BBANDS", "RSI"],
        performance: "+19.3%"
      },
      {
        name: "Altcoin Season Rotator",
        description: "Automatically rotates capital to altcoins showing momentum during bull markets.",
        indicators: ["EMA", "Volume"],
        performance: "+24.8%"
      },
      {
        name: "DeFi Yield Optimizer",
        description: "Rotates between DeFi tokens based on relative yield and price momentum.",
        indicators: ["RSI", "SMA"],
        performance: "+16.2%"
      }
    ],
    // Options
    [
      {
        name: "Volatility Crush",
        description: "Sells options premium before earnings when implied volatility is high.",
        indicators: ["IV Rank", "BBANDS"],
        performance: "+8.6%"
      },
      {
        name: "Diagonal Spreads",
        description: "Creates time-based spreads to profit from theta decay while limiting risk.",
        indicators: ["ATR", "SMA"],
        performance: "+11.2%"
      },
      {
        name: "SPY Weekly Iron Condors",
        description: "Sells weekly premium on SPY using iron condors to benefit from range-bound markets.",
        indicators: ["Keltner Channels", "RSI"],
        performance: "+7.9%"
      }
    ]
  ];

  // Pricing tiers
  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for beginners learning algorithmic trading",
      features: [
        "3 active strategies",
        "Basic backtesting",
        "Paper trading",
        "Standard indicators",
        "Community support"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "For active traders looking to automate their strategies",
      features: [
        "Unlimited strategies",
        "Advanced backtesting",
        "Live trading",
        "All technical indicators",
        "Priority support",
        "Strategy marketplace access",
        "Risk management suite"
      ],
      cta: "Start 14-Day Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For professional traders and investment firms",
      features: [
        "All Pro features",
        "Dedicated account manager",
        "Custom indicator development",
        "Advanced API access",
        "Multi-account management",
        "Compliance reporting",
        "White labeling options"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  // Navigation drawer for mobile
  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {['Strategies', 'Pricing'].map((text, index) => (
          <ListItem button key={text} component="a" href={`#${text.toLowerCase()}`}>
            <ListItemText primary={text} />
          </ListItem>
        ))}
        <ListItem>
          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: customColors.accent,
              color: customColors.primary,
              '&:hover': {
                bgcolor: customColors.light
              }
            }}
          >
            Sign Up Free
          </Button>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Navigation */}


      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>

      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: customColors.primary,
          color: customColors.secondary,
          pt: 8,
          pb: 8
        }}
      >
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Automate Your Trading Strategy with <Box component="span" sx={{ color: customColors.accent }}>No Code</Box>
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: customColors.accent }}>
                Build, backtest, and deploy algorithmic trading strategies across stocks, crypto, and options—without writing a single line of code.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{
                    bgcolor: customColors.accent,
                    color: customColors.primary,
                    '&:hover': {
                      bgcolor: customColors.light
                    }
                  }}
                >
                  Get Started Free
                </Button>
              </Box>
  
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Strategy Showcase Section */}
      <Box id="strategies" sx={{ py: 8, bgcolor: customColors.secondary }}>
        <Container>
          <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ color: customColors.primary }}>
            Popular Trading Strategies
          </Typography>
          <Typography variant="h6" align="center" paragraph sx={{ mb: 6, maxWidth: 700, mx: 'auto', color: customColors.primary }}>
            Browse our marketplace of pre-built strategies or create your own custom algorithms.
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              centered
              sx={{ 
                '& .MuiTab-root': { color: customColors.primary },
                '& .Mui-selected': { color: customColors.primary, fontWeight: 'bold' },
                '& .MuiTabs-indicator': { backgroundColor: customColors.accent }
              }}
            >
              <Tab label="Stocks" />
              <Tab label="Crypto" />
              <Tab label="Options" />
            </Tabs>
          </Box>

          <Grid container spacing={4}>
            {strategiesData[activeTab].map((strategy, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3">
                        {strategy.name}
                      </Typography>
                      <Typography variant="subtitle1" color="success.main" fontWeight="bold">
                        {strategy.performance}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {strategy.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {strategy.indicators.map((indicator, i) => (
                        <Chip
                          key={i}
                          label={indicator}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(13, 55, 42, 0.1)', 
                            color: customColors.primary
                          }}
                        />
                      ))}
                    </Box>
                    <Button 
                      endIcon={<ChevronRight size={16} />}
                      sx={{ 
                        color: customColors.primary,
                        fontWeight: 'medium',
                        p: 0,
                        '&:hover': {
                          bgcolor: 'transparent',
                          opacity: 0.8
                        }
                      }}
                    >
                      View details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button 
              variant="outlined" 
              size="large"
              sx={{
                borderColor: customColors.primary,
                color: customColors.primary,
                '&:hover': {
                  borderColor: customColors.accent,
                  bgcolor: 'rgba(212, 200, 146, 0.1)'
                }
              }}
            >
              Browse All Strategies
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box id="pricing" sx={{ py: 8 }}>
        <Container>
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="h6" align="center" paragraph sx={{ mb: 6, maxWidth: 700, mx: 'auto', color: 'text.secondary' }}>
            Choose the plan that's right for your trading goals
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            {pricingTiers.map((tier, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <StyledCard popular={tier.popular} sx={{ position: 'relative' }}>
                  
                  <CardContent sx={{ pt: tier.popular ? 4 : 2 }}>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {tier.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                      <Typography variant="h3" component="span">
                        {tier.price}
                      </Typography>
                      <Typography variant="subtitle1" color="textSecondary" component="span" sx={{ ml: 1 }}>
                        {tier.period}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                      {tier.description}
                    </Typography>
                    
                    <Button 
                      variant={tier.popular ? "contained" : "outlined"}
                      fullWidth
                      sx={{
                        mb: 3,
                        bgcolor: tier.popular ? customColors.accent : 'transparent',
                        color: tier.popular ? customColors.primary : 'text.primary',
                        borderColor: !tier.popular ? 'divider' : 'transparent',
                        '&:hover': {
                          bgcolor: tier.popular ? customColors.light : 'rgba(13, 55, 42, 0.1)',
                          borderColor: !tier.popular ? customColors.accent : 'transparent'
                        }
                      }}
                    >
                      {tier.cta}
                    </Button>
                    
                    <List sx={{ p: 0 }}>
                      {tier.features.map((feature, i) => (
                        <ListItem key={i} sx={{ px: 0, py: 0.75 }}>
                          <CheckIcon size={16} color={customColors.accent} style={{ marginRight: 8 }} />
                          <Typography variant="body2">{feature}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, bgcolor: customColors.secondary }}>
        <Container>
          <Box sx={{ 
            maxWidth: 800, 
            mx: 'auto', 
            textAlign: 'center', 
            p: 4, 
            border: `2px solid ${customColors.accent}`,
            borderRadius: 2
          }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ color: customColors.primary }}>
              Ready to Automate Your Trading?
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 4, color: customColors.primary }}>
              Join thousands of traders using Bot Club to build, test, and deploy profitable trading strategies.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              sx={{
                bgcolor: customColors.accent,
                color: customColors.primary,
                '&:hover': {
                  bgcolor: customColors.light
                }
              }}
            >
              Get Started Free
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ 
        bgcolor: customColors.primary,
        color: customColors.secondary,
        py: 4
      }}>
        <Container>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Bot Club
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © {new Date().getFullYear()} Bot Club. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;