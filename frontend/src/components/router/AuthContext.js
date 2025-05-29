// 3. Use a single AuthContext implementation
// /frontend/src/router/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { authApi } from '../../api/Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          console.log('Token found, fetching user data...');
          const response = await authApi.getUserProfile(); // Consistent method
          console.log('User data fetched:', response);
          setUser(response); // API returns user data directly, not wrapped in .user
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          authApi.logout();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      console.log('Attempting login...');
      const loginResponse = await authApi.login(email, password);
      console.log('Login response:', loginResponse);
      
      // Get user data after login
      const userResponse = await authApi.getUserProfile(); // Use profile endpoint
      console.log('User data after login:', userResponse);
      
      setUser(userResponse); // API returns user data directly, not wrapped in .user
      setLoading(false);
      
      return { 
        data: { 
          user: userResponse, // Return user data directly
          token: loginResponse.access_token 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Sign In error:', error);
      setLoading(false);
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed. Please check your credentials.';
      return { data: null, error: { message: errorMessage } };
    }
  };

  const signUp = async (name, email, password) => {
    setLoading(true);
    try {
      console.log('Attempting registration...');
      const registrationData = {
        userName: name,
        email: email,
        password: password,
        firstName: name,
        lastName: '',
      };

      await authApi.register(registrationData);
      console.log('Registration successful, logging in...');
      
      // After successful registration, login automatically
      const loginResponse = await authApi.login(email, password);
      
      // Get user profile
      const userResponse = await authApi.getUserProfile(); // Use profile endpoint
      setUser(userResponse); // API returns user data directly, not wrapped in .user
      setLoading(false);
      
      return { 
        data: { 
          user: userResponse, // Return user data directly
          token: loginResponse.access_token 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Sign Up error:', error);
      setLoading(false);
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed. Please try again.';
      return { data: null, error: { message: errorMessage } };
    }
  };

  const signOut = () => {
    console.log('Signing out...');
    authApi.logout();
    setUser(null);
  };

  // Function to refresh user data (useful after profile updates)
  const refreshUser = async () => {
    try {
      console.log('Refreshing user data...');
      const response = await authApi.getUserProfile(); // Use profile endpoint
      console.log('Refreshed user data:', response);
      setUser(response); // API returns user data directly, not wrapped in .user
      return response; // Return user data directly
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't logout on refresh error unless it's an auth error
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut();
      }
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshUser, // Add refresh function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}