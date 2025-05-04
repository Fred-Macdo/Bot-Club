import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  useTheme 
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import Card from '../common/Card';
import Button from '../common/Button';

const Pricing = ({ id }) => {
  const theme = useTheme();

  const pricingTiers = [
    {
      title: 'Starter',
      price: '$49',
      period: '/month',
      description: 'Perfect for beginners',
      features: [
        'Access to basic trading bots',
        'Pre-built strategies',
        'Standard market data',
        'Email support'
      ],
      buttonText: 'Start Free Trial',
      highlighted: false
    },
    {
      title: 'Pro',
      price: '$99',
      period: '/month',
      description: 'For serious traders',
      features: [
        'Access to all trading bots',
        'Strategy Builder',
        'Premium market data',
        'Priority support',
        'Performance analytics'
      ],
      buttonText: 'Get Started',
      highlighted: true
    },
    {
      title: 'Enterprise',
      price: '$249',
      period: '/month',
      description: 'For professional traders',
      features: [
        'Custom bot development',
        'Advanced strategy tools',
        'Real-time data feeds',
        'Dedicated account manager',
        'API access',
        'White-label solutions'
      ],
      buttonText: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <Box 
      id={id}
      sx={{ 
        py: { xs: 6, md: 10 },
        bgcolor: theme.palette.background.paper
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
            Pricing Plans
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
            Choose the perfect plan for your trading needs
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {pricingTiers.map((tier, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                highlighted={tier.highlighted}
                elevation={tier.highlighted ? 8 : 2}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  zIndex: tier.highlighted ? 2 : 1
                }}
              >
                {/* Tier Title */}
                <Typography 
                  variant="h5" 
                  component="h3" 
                  align="center" 
                  sx={{ 
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 2
                  }}
                >
                  {tier.title}
                </Typography>
                
                {/* Price */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline' }}>
                    <Typography 
                      variant="h3" 
                      component="span" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.primary.main
                      }}
                    >
                      {tier.price}
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      component="span" 
                      sx={{ 
                        ml: 0.5,
                        color: theme.palette.text.secondary
                      }}
                    >
                      {tier.period}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="subtitle1"
                    sx={{ 
                      color: theme.palette.text.secondary,
                      mt: 1
                    }}
                  >
                    {tier.description}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Features List */}
                <List sx={{ mb: 3, flexGrow: 1 }}>
                  {tier.features.map((feature, i) => (
                    <ListItem key={i} dense disableGutters>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckIcon sx={{ color: theme.palette.accent.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: theme.palette.text.primary
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
                
                {/* CTA Button */}
                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Button
                    variant={tier.highlighted ? "contained" : "outlined"}
                    color={tier.highlighted ? "accent" : "primary"}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {tier.buttonText}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Pricing;