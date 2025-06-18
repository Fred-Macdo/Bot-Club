// src/context/AlpacaContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../components/router/AuthContext';

const AlpacaContext = createContext();

export function AlpacaProvider({ children }) {
  const { user } = useAuth();
  const [alpacaConfig, setAlpacaConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  useEffect(() => {
    // Get Alpaca configuration from backend API
    const fetchAlpacaConfig = async () => {
      if (!user) {
        setAlpacaConfig(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = getAuthToken();
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/alpaca-config`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAlpacaConfig(data);
        } else if (response.status === 404) {
          // No config found, this is normal for new users
          setAlpacaConfig(null);
        } else {
          console.error('Error fetching Alpaca config:', response.statusText);
          setAlpacaConfig(null);
        }
      } catch (error) {
        console.error('Error in fetchAlpacaConfig:', error);
        setAlpacaConfig(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAlpacaConfig();
  }, [user]);

  // Save Alpaca configuration to backend
  const saveAlpacaConfig = async (config) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/alpaca-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          api_key: config.apiKey,
          api_secret: config.apiSecret,
          endpoint: config.endpoint,
          is_paper: config.isPaper
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state with response data
        setAlpacaConfig(data);
        
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Failed to save configuration' };
      }
    } catch (error) {
      console.error('Error saving Alpaca config:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  // Test Alpaca API connection
  const testAlpacaConnection = async (config) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/alpaca-config/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          api_key: config.apiKey,
          api_secret: config.apiSecret,
          endpoint: config.endpoint,
          is_paper: config.isPaper
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error testing Alpaca connection:', error);
      return { success: false, error: 'Failed to connect to Alpaca API' };
    }
  };

  const value = {
    alpacaConfig: alpacaConfig ? {
      apiKey: alpacaConfig.api_key,
      apiSecret: alpacaConfig.api_secret,
      endpoint: alpacaConfig.endpoint,
      isPaper: alpacaConfig.is_paper
    } : null,
    isConfigured: !!alpacaConfig,
    loading,
    saveAlpacaConfig,
    testAlpacaConnection
  };

  return <AlpacaContext.Provider value={value}>{children}</AlpacaContext.Provider>;
}

export function useAlpaca() {
  return useContext(AlpacaContext);
}