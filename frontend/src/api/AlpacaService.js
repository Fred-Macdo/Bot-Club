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

export const fetchUserStrategies = async (userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategies`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const strategies = await response.json();
    return { success: true, strategies };
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return { success: false, error: 'Failed to fetch strategies' };
  }
};

export const saveStrategy = async (strategy, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(strategy)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const savedStrategy = await response.json();
    return { success: true, strategy: savedStrategy };
  } catch (error) {
    console.error('Error saving strategy:', error);
    return { success: false, error: 'Failed to save strategy' };
  }
};

export const updateStrategy = async (id, strategy, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(strategy)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const updatedStrategy = await response.json();
    return { success: true, strategy: updatedStrategy };
  } catch (error) {
    console.error('Error updating strategy:', error);
    return { success: false, error: 'Failed to update strategy' };
  }
};

export const deleteStrategy = async (id, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategies/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return { success: false, error: 'Failed to delete strategy' };
  }
};

export const runBacktest = async (id, params, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategies/${id}/backtest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, ...result };
  } catch (error) {
    console.error('Error running backtest:', error);
    return { success: false, error: 'Failed to run backtest' };
  }
};

export const getBacktestResults = async (strategyId, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategies/${strategyId}/backtest`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const results = await response.json();
    return { success: true, results };
  } catch (error) {
    console.error('Error fetching backtest results:', error);
    return { success: false, error: 'Failed to fetch backtest results' };
  }
};

export const toggleLiveTrading = async (id, isActive, userId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/api/strategies/${id}/toggle`, {
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