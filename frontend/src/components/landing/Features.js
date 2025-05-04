import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  useTheme 
} from '@mui/material';
import Card from '../common/Card';
import {
  ShowChart as ShowChartIcon,
  Code as CodeIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const Features = ({ id }) => {
  const theme = useTheme();

  const features = [
    {
      title: 'Trading Bots',
      description: 'Automated trading solutions using advanced algorithms and real-time market analysis.',
      icon: <ShowChartIcon fontSize="large" sx={{ color: theme.palette.accent.main }} />
    },
    {
      title: 'Strategy Builder',
      description: 'Build custom trading strategies with our intuitive drag-and-drop interface.',
      icon: <CodeIcon fontSize="large" sx={{ color: theme.palette.accent.main }} />
    },
    {
      title: 'Market Analysis',
      description: 'Comprehensive market analysis tools powered by AI and machine learning.',
      icon: <BarChartIcon fontSize="large" sx={{ color: theme.palette.accent.main }} />
    },
    {
      title: 'Risk Management',
      description: 'Advanced risk management tools to protect your investments.',
      icon: <SecurityIcon fontSize="large" sx={{ color: theme.palette.accent.main }} />
    }
  ];

  return (
    <Box 
      id={id}
      sx={{ 
        py: { xs: 6, md: 10 },
        bgcolor: theme.palette.background.default
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              mb: 2, 
              fontWeight: 700,
              color: theme.palette.primary.main
            }}
          >
            Powerful Features
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              color: theme.palette.text.secondary,
              maxWidth: 700,
              mx: 'auto',
              fontWeight: 400
            }}
          >
            Our cutting-edge trading bots are designed to help you succeed in any market condition
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                title={feature.title}
                icon={feature.icon}
                elevation={2}
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* How It Works Section */}
        <Box sx={{ mt: 10, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              mb: 2, 
              fontWeight: 700,
              color: theme.palette.primary.main
            }}
          >
            How It Works
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 6, 
              color: theme.palette.text.secondary,
              maxWidth: 700,
              mx: 'auto',
              fontWeight: 400
            }}
          >
            Get started with Bot Club in three simple steps
          </Typography>
          
          <Grid container spacing={6} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  bgcolor: theme.palette.background.paper,
                  height: '100%',
                  boxShadow: 2
                }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    color: theme.palette.accent.main, 
                    mb: 2,
                    fontWeight: 700,
                    fontSize: '3rem'
                  }}
                >
                  1
                </Typography>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Sign Up
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create your Bot Club account and connect your trading account through our secure API
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  bgcolor: theme.palette.background.paper,
                  height: '100%',
                  boxShadow: 2
                }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    color: theme.palette.accent.main, 
                    mb: 2,
                    fontWeight: 700,
                    fontSize: '3rem'
                  }}
                >
                  2
                </Typography>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Configure Your Bot
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Choose a pre-built strategy or create your own using our Strategy Builder
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  bgcolor: theme.palette.background.paper,
                  height: '100%',
                  boxShadow: 2
                }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    color: theme.palette.accent.main, 
                    mb: 2,
                    fontWeight: 700,
                    fontSize: '3rem'
                  }}
                >
                  3
                </Typography>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Launch & Monitor
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Activate your bot and monitor its performance through our intuitive dashboard
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Features;