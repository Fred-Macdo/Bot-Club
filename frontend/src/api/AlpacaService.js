// src/api/alpacaService.js
// This file will handle our API calls to the FastAPI backend
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

export const fetchUserStrategies = async (token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/strategies`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return { success: false, error: 'Failed to fetch strategies' };
  }
};

export const saveStrategy = async (strategy, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/strategies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(strategy)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error saving strategy:', error);
    return { success: false, error: 'Failed to save strategy' };
  }
};

export const updateStrategy = async (id, strategy, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/strategies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(strategy)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error updating strategy:', error);
    return { success: false, error: 'Failed to update strategy' };
  }
};

export const deleteStrategy = async (id, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/strategies/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return { success: false, error: 'Failed to delete strategy' };
  }
};

export const runBacktest = async (id, params, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/backtest/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error running backtest:', error);
    return { success: false, error: 'Failed to run backtest' };
  }
};

export const startPaperTrading = async (id, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/paper-trading/${id}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error starting paper trading:', error);
    return { success: false, error: 'Failed to start paper trading' };
  }
};

export const stopPaperTrading = async (id, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/paper-trading/${id}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error stopping paper trading:', error);
    return { success: false, error: 'Failed to stop paper trading' };
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