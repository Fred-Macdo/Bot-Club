// 7. Update RegisterPage.js with the correct auth hook
// /frontend/src/components/auth/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../router/AuthContext'; // Updated path
import {
  Box, Button, TextField, Typography, Paper, Container, Alert, CircularProgress, Link
} from '@mui/material';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth(); // Use the auth hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    const { error } = await signUp({ email, password });
    setLoading(false);

    if (error) {
      setFormError(error.message);
    } else {
      navigate('/login');
    }
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
          backgroundColor: '#113c35',
          color: '#d4c892',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ color: '#d4c892', fontWeight: 700, mb: 3 }}>
          Register
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
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
            autoComplete="new-password"
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
            {loading ? <CircularProgress size={24} /> : 'REGISTER'}
          </Button>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#d4c892' }}>
              {"Already have an account? Login"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;