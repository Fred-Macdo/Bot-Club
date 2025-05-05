// src/context/AlpacaContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../components/router/AuthContext';
import { supabase } from '../lib/supabase';

const AlpacaContext = createContext();

export function AlpacaProvider({ children }) {
  const { user } = useAuth();
  const [alpacaConfig, setAlpacaConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get Alpaca configuration from database
    const fetchAlpacaConfig = async () => {
      if (!user) {
        setAlpacaConfig(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('alpaca_configs')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching Alpaca config:', error);
          setAlpacaConfig(null);
        } else {
          setAlpacaConfig(data);
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

  // Save Alpaca configuration to database
  const saveAlpacaConfig = async (config) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      // Check if config already exists
      const { data, error: selectError } = await supabase
        .from('alpaca_configs')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is the "not found" error
        return { success: false, error: selectError };
      }

      let result;
      
      if (data?.id) {
        // Update existing config
        result = await supabase
          .from('alpaca_configs')
          .update({
            api_key: config.apiKey,
            api_secret: config.apiSecret,
            endpoint: config.endpoint,
            is_paper: config.isPaper,
            updated_at: new Date()
          })
          .eq('id', data.id);
      } else {
        // Insert new config
        result = await supabase
          .from('alpaca_configs')
          .insert({
            user_id: user.id,
            api_key: config.apiKey,
            api_secret: config.apiSecret,
            endpoint: config.endpoint,
            is_paper: config.isPaper,
            created_at: new Date(),
            updated_at: new Date()
          });
      }

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Update local state
      setAlpacaConfig({
        ...config,
        user_id: user.id,
      });

      return { success: true };
    } catch (error) {
      console.error('Error saving Alpaca config:', error);
      return { success: false, error };
    }
  };

  // Test Alpaca API connection
  const testAlpacaConnection = async (config) => {
    try {
      // This would call your backend API to test the connection
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/test-alpaca`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          apiKey: config.apiKey || alpacaConfig?.api_key,
          apiSecret: config.apiSecret || alpacaConfig?.api_secret,
          endpoint: config.endpoint || alpacaConfig?.endpoint,
          isPaper: config.isPaper !== undefined ? config.isPaper : alpacaConfig?.is_paper
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