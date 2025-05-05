// 6. Update LoginPage.js with the correct auth hook
// /frontend/src/components/auth/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../router/AuthContext'; // Updated path
import {
  Box, Button, TextField, Typography, Paper, Container, Alert, CircularProgress, Link
} from '@mui/material';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth(); // Use the auth hook and get user state

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    console.log('Attempting to sign in with:', { email });

    try {
      const { data, error } = await signIn({ email, password });
      
      console.log('Sign in response:', { data, error });
      
      if (error) {
        setFormError(error.message || 'Failed to sign in. Please check your credentials.');
        setLoading(false);
      } else if (data && data.user) {
        console.log('Login successful, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        // This handles the case where there's no error but also no user data
        console.warn('No error but no user data returned from auth');
        setFormError('Something went wrong with authentication. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setFormError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  };

  // For testing/demo purposes - auto-fill credentials
  const fillDemoCredentials = () => {
    setEmail('demo@botclub.com');
    setPassword('demo123');
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5edd8', // Light cream background
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#07372a', // Dark green card
          color: '#d4c892',           // Gold text
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ color: '#d4c892', fontWeight: 700, mb: 3 }}>
          Login
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ mt: 2, width: '100%', mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <Typography sx={{ color: '#d4c892', mb: 1 }}>Email Address *</Typography>
          <TextField
            required
            fullWidth
            id="email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            variant="outlined"
            InputProps={{
              sx: {
                backgroundColor: '#f5edd8',
                color: '#07372a',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
              }
            }}
            sx={{ mb: 3 }}
          />
          
          <Typography sx={{ color: '#d4c892', mb: 1 }}>Password *</Typography>
          <TextField
            required
            fullWidth
            name="password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            variant="outlined"
            InputProps={{
              sx: {
                backgroundColor: '#f5edd8',
                color: '#07372a',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
              }
            }}
            sx={{ mb: 3 }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 1, 
              mb: 2,
              py: 1.5,
              backgroundColor: '#d4c892',
              color: '#07372a',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#bfae6a' },
              textTransform: 'uppercase'
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'LOGIN'}
          </Button>
          
          {/* Added demo button for easy testing */}
          <Button
            fullWidth
            variant="outlined"
            onClick={fillDemoCredentials}
            sx={{
              mb: 2,
              borderColor: '#d4c892',
              color: '#d4c892',
              '&:hover': {
                borderColor: '#f5edd8',
                backgroundColor: 'rgba(245, 237, 216, 0.1)'
              }
            }}
            disabled={loading}
          >
            Use Demo Account
          </Button>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Link component={RouterLink} to="/register" variant="body2" sx={{ color: '#d4c892' }}>
              {"Don't have an account? Register"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;