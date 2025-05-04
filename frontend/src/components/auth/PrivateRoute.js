// 5. Update PrivateRoute.js to use the correct AuthContext
// /frontend/src/components/auth/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../router/AuthContext'; // Updated path
import { Box, CircularProgress, Typography } from '@mui/material';

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#113c35',
          color: '#d4c892',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#d4c892' }} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, redirect to login
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;