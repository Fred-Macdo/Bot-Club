// src/components/landing/CallToAction.js
import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  TextField, 
  InputAdornment,
  useTheme
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import Button from '../common/Button';

const CallToAction = () => {
  const theme = useTheme();

  return (
    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="md">
        <Box 
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            bgcolor: theme.palette.secondary.main,
            border: `2px solid ${theme.palette.accent.main}`,
            boxShadow: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative elements */}
          <Box 
            sx={{
              position: 'absolute',
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: theme.palette.accent.main,
              opacity: 0.1,
              top: -20,
              right: -20
            }}
          />
          <Box 
            sx={{
              position: 'absolute',
              width: 50,
              height: 50,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.main,
              opacity: 0.1,
              bottom: -10,
              left: -10
            }}
          />
          
          <Grid container spacing={4} alignItems="center" position="relative">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: theme.palette.primary.main
                }}
              >
                Ready to Automate Your Trading?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  color: theme.palette.primary.main,
                  opacity: 0.8
                }}
              >
                Join Bot Club today and experience the power of automated trading. Start with a 14-day free trial, no credit card required.
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box 
                component="form" 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2 
                }}
              >
                <TextField
                  placeholder="Your Email"
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: theme.palette.primary.main }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderRadius: 1,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.accent.main,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.accent.main,
                      },
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                  }}
                >
                  Get Started Free
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default CallToAction;