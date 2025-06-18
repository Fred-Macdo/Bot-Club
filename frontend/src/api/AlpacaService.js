// src/api/alpacaService.js
// This file will handle our API calls to the FastAPI backend
import { authApi } from './Client';

const BASE_URL = process.env.REACT_APP_API_URL || '';

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

export const testAlpacaConnection = async (config, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/test-alpaca`, {
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
    
    return await response.json();
  } catch (error) {
    console.error('Error testing Alpaca connection:', error);
    return { success: false, error: 'Failed to connect to API server' };
  }
};

// Strategy Management Functions
export const saveStrategy = async (strategyData, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategy/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(strategyData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save strategy');
    }

    const result = await response.json();
    return { success: true, strategy: result };
  } catch (error) {
    console.error('Error saving strategy:', error);
    return { success: false, error: error.message };
  }
};

export const fetchUserStrategies = async (userId) => {
  try {
    const token = getAuthToken();
    console.log('Fetching user strategies with token:', token ? 'Token exists' : 'No token'); // Debug log
    
    const response = await fetch(`${BASE_URL}/api/strategy/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('User strategies response status:', response.status); // Debug log

    if (!response.ok) {
      const errorData = await response.json();
      console.error('User strategies error:', errorData); // Debug log
      throw new Error(errorData.detail || 'Failed to fetch strategies');
    }

    const strategies = await response.json();
    console.log('User strategies response:', strategies); // Debug log
    return { success: true, strategies };
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return { success: false, error: error.message, strategies: [] };
  }
};

export const fetchDefaultStrategies = async () => {
  try {
    console.log('Fetching default strategies from:', `${BASE_URL}/api/strategy/default`); // Debug log
    
    const response = await fetch(`${BASE_URL}/api/strategy/default`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Default strategies response status:', response.status); // Debug log

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Default strategies error:', errorData); // Debug log
      throw new Error(errorData.detail || 'Failed to fetch default strategies');
    }

    const strategies = await response.json();
    console.log('Default strategies response:', strategies); // Debug log
    return { success: true, strategies };
  } catch (error) {
    console.error('Error fetching default strategies:', error);
    return { success: false, error: error.message, strategies: [] };
  }
};

export const runBacktest = async (strategyId, backtestParams, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategy/${strategyId}/backtest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(backtestParams)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to run backtest');
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    console.error('Error running backtest:', error);
    return { success: false, error: error.message };
  }
};

export const updateStrategy = async (strategyId, strategyData, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategy/${strategyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(strategyData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update strategy');
    }

    const result = await response.json();
    return { success: true, strategy: result };
  } catch (error) {
    console.error('Error updating strategy:', error);
    return { success: false, error: error.message };
  }
};

export const deleteStrategy = async (strategyId, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategy/${strategyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete strategy');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return { success: false, error: error.message };
  }
};

export const toggleLiveTrading = async (id, isActive, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategy/${id}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_active: isActive })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, strategy: result };
  } catch (error) {
    console.error('Error toggling live trading:', error);
    return { success: false, error: 'Failed to toggle live trading' };
  }
};

export const startLiveTrading = async (id, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/live-trading/${id}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error starting live trading:', error);
    return { success: false, error: 'Failed to start live trading' };
  }
};

export const stopLiveTrading = async (id, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/live-trading/${id}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error stopping live trading:', error);
    return { success: false, error: 'Failed to stop live trading' };
  }
};