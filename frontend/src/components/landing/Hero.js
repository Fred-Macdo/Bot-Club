import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import Button from '../common/Button';
import botLogo from '../../assets/images/bot-logo.png';

const Hero = ({ title, subtitle, primaryCta, secondaryCta }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box 
      sx={{ 
        bgcolor: theme.palette.primary.main,
        color: theme.palette.secondary.main,
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorative elements */}
      <Box 
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          opacity: 0.1,
          zIndex: 0,
          background: 'radial-gradient(circle, transparent 20%, #0d372a 20%, #0d372a 80%, transparent 80%, transparent), radial-gradient(circle, transparent 20%, #0d372a 20%, #0d372a 80%, transparent 80%, transparent) 50px 50px',
          backgroundSize: '100px 100px',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h2" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2
              }}
            >
              {title || "Automate Your Trading with AI-Powered Bots"}
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4, 
                color: theme.palette.accent.main, 
                fontWeight: 300,
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              {subtitle || "Powerful trading algorithms designed to maximize your returns"}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {primaryCta || 
                <Button 
                  variant="contained" 
                  color="accent" 
                  size="large"
                  sx={{ 
                    px: 4,
                    py: 1.5
                  }}
                >
                  Get Started
                </Button>
              }
              
              {secondaryCta || 
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  size="large"
                  sx={{ 
                    px: 4,
                    py: 1.5
                  }}
                >
                  Learn More
                </Button>
              }
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box 
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                height: isMobile ? '300px' : '400px',
              }}
            >
              {/* Main image */}
              <Box 
                component="img"
                src={botLogo}
                alt="Bot Club Trading Dashboard"
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 2,
                  border: `4px solid ${theme.palette.accent.main}`,
                  boxShadow: 4,
                  position: 'relative',
                  zIndex: 2
                }}
              />
              
              {/* Decorative dollar sign floating animation */}
              <Box 
                sx={{
                  position: 'absolute',
                  top: '20%',
                  right: '5%',
                  color: theme.palette.accent.main,
                  fontSize: '2rem',
                  animation: 'float 3s ease-in-out infinite',
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                  },
                  zIndex: 1
                }}
              >
                $
              </Box>
              
              {/* Chart graph decoration */}
              <Box 
                sx={{
                  position: 'absolute',
                  bottom: '10%',
                  left: '5%',
                  zIndex: 1,
                  width: '60px',
                  height: '40px',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(to top right, transparent 49.5%, ${theme.palette.accent.main} 49.5%, ${theme.palette.accent.main} 50.5%, transparent 50.5%)`,
                    backgroundSize: '10px 10px',
                    opacity: 0.8
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Hero;