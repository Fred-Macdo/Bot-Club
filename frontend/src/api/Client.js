// Base API configuration and HTTP client for the Bot Club frontend

class ApiClient {
  constructor() {
    // Check if we're running in Docker environment
    const isDocker = process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.includes('backend:');
    
    // If running in Docker, use empty string to leverage proxy
    // Otherwise use the configured API URL or default to localhost
    this.baseURL = isDocker ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:8000');
    this.tokenKey = 'authToken'; // Use consistent key
    
    console.log('ApiClient - Environment:', process.env.NODE_ENV);
    console.log('ApiClient - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('ApiClient - Is Docker:', isDocker);
    console.log('ApiClient - Using baseURL:', this.baseURL);
  }

  // Get stored token from localStorage
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Save token to localStorage
  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Base fetch method with authentication
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    // Default headers - but don't set Content-Type if body is FormData
    const headers = {
      ...options.headers,
    };

    // Only set JSON content type if we're not sending FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add authentication header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.removeToken();
        // Redirect to login or trigger auth error
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          
          // Handle validation errors (422) - FastAPI format
          if (response.status === 422 && errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Handle FastAPI validation errors
              errorMessage = errorData.detail.map(err => {
                const location = err.loc && Array.isArray(err.loc) ? err.loc.join('.') : 'field';
                const message = err.msg || 'validation error';
                return `${location}: ${message}`;
              }).join(', ');
            } else if (typeof errorData.detail === 'string') {
              // Handle simple string detail
              errorMessage = errorData.detail;
            } else {
              // Handle other detail formats
              errorMessage = JSON.stringify(errorData.detail);
            }
          } else {
            // Handle other error formats
            errorMessage = errorData.detail || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      // Return JSON if response has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', {
        url,
        method: config.method || 'GET',
        error: error.message,
        status: error.status
      });
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Special method for form data (login)
  async postForm(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        // Remove Content-Type completely - let browser set it for FormData
        ...options.headers,
      },
      body: formData,
    });
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

// 🔐 AUTHENTICATION METHODS - Cleaned up to use consistent token management
export const authApi = {
  // Check if user is authenticated
  isAuthenticated() {
    return apiClient.isAuthenticated();
  },

  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.postForm('/api/auth/token', formData);
    
    // Save token using ApiClient's method
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    
    return response;
  },

  async register(userData) {
    const response = await apiClient.post('/api/auth/register', userData);
    
    // If registration returns a token, save it
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    
    return response;
  },

  // Use consistent profile endpoint
  async getUserProfile() {
    return apiClient.get('/api/users/me');
  },

  async updateUserProfile(profileData) {
    return apiClient.put('/api/users/me', profileData);
  },

  logout() {
    apiClient.removeToken();
  },
};

// 👤 USER METHODS - Keep these for consistency but they're duplicates now
export const userApi = {
  // Get current user profile
  async getProfile() {
    return apiClient.get('/api/users/me');
  },

  // Update user profile
  async updateProfile(userData) {
    return apiClient.put('/api/users/me', userData);
  },

  // Delete user account (if needed in future)
  async deleteAccount() {
    return apiClient.delete('/api/users/me');
  },
};

// 🔧 USER CONFIG METHODS - Add these after the existing userApi section
export const userConfigApi = {
  // Get user API configuration
  async getConfig() {
    return apiClient.get('/api/user-config/');
  },

  // Save Alpaca configuration
  async saveAlpacaConfig(configData) {
    return apiClient.post('/api/user-config/alpaca', configData);
  },

  // Save Polygon configuration
  async savePolygonConfig(configData) {
    return apiClient.post('/api/user-config/polygon', configData);
  },

  // Delete Alpaca configuration
  async deleteAlpacaConfig() {
    return apiClient.delete('/api/user-config/alpaca');
  },

  // Delete Polygon configuration
  async deletePolygonConfig() {
    return apiClient.delete('/api/user-config/polygon');
  },
};

// 📈 STRATEGY METHODS
export const strategyApi = {
  // Get all user's strategies
  async getStrategies() {
    return apiClient.get('/api/strategies');
  },

  // Get single strategy by ID
  async getStrategy(strategyId) {
    return apiClient.get(`/api/strategies/${strategyId}`);
  },

  // Create new strategy
  async createStrategy(strategyData) {
    return apiClient.post('/api/strategies', strategyData);
  },

  // Update existing strategy
  async updateStrategy(strategyId, strategyData) {
    return apiClient.put(`/api/strategies/${strategyId}`, strategyData);
  },

  // Delete strategy
  async deleteStrategy(strategyId) {
    return apiClient.delete(`/api/strategies/${strategyId}`);
  },

  // Backtest a strategy
  async backtestStrategy(strategyId, backtestParams) {
    return apiClient.post(`/api/strategies/${strategyId}/backtest`, backtestParams);
  },

  // Get backtest results
  async getBacktestResults(strategyId, backtestId = null) {
    if (backtestId) {
      return apiClient.get(`/api/strategies/${strategyId}/backtest/${backtestId}`);
    }
    return apiClient.get(`/api/strategies/${strategyId}/backtest`);
  },

  // Start/stop live trading
  async toggleLiveTrading(strategyId, isActive) {
    return apiClient.post(`/api/strategies/${strategyId}/toggle`, { is_active: isActive });
  },
};

// 🔑 API KEYS METHODS
export const apiKeysApi = {
  // Get user's API keys (encrypted/masked)
  async getApiKeys() {
    return apiClient.get('/api/keys');
  },

  // Add new API key
  async addApiKey(keyData) {
    return apiClient.post('/api/keys', keyData);
  },

  // Update API key
  async updateApiKey(keyId, keyData) {
    return apiClient.put(`/api/keys/${keyId}`, keyData);
  },

  // Delete API key
  async deleteApiKey(keyId) {
    return apiClient.delete(`/api/keys/${keyId}`);
  },

  // Test API key connection
  async testApiKey(keyId) {
    return apiClient.post(`/api/keys/${keyId}/test`);
  },
};

// 📊 TRADING/PORTFOLIO METHODS
export const tradingApi = {
  // Get portfolio overview
  async getPortfolio() {
    return apiClient.get('/api/trading/portfolio');
  },

  // Get trading history
  async getTradingHistory(limit = 50, offset = 0) {
    return apiClient.get(`/api/trading/history?limit=${limit}&offset=${offset}`);
  },

  // Get active positions
  async getActivePositions() {
    return apiClient.get('/api/trading/positions');
  },

  // Get performance metrics
  async getPerformanceMetrics(timeframe = '30d') {
    return apiClient.get(`/api/trading/performance?timeframe=${timeframe}`);
  },
};

// 📈 MARKET DATA METHODS
export const marketApi = {
  // Get market data for symbols
  async getMarketData(symbols, timeframe = '1d') {
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    return apiClient.get(`/api/market/data?symbols=${symbolsParam}&timeframe=${timeframe}`);
  },

  // Get available symbols
  async getAvailableSymbols() {
    return apiClient.get('/api/market/symbols');
  },

  // Get market indicators
  async getMarketIndicators(symbol, indicators) {
    const indicatorsParam = Array.isArray(indicators) ? indicators.join(',') : indicators;
    return apiClient.get(`/api/market/indicators?symbol=${symbol}&indicators=${indicatorsParam}`);
  },
};

// Export the main client for custom requests
export default apiClient;

// 🚀 USAGE EXAMPLES:

/* 
// In your React components:

// Login
import { authApi } from '../api/client';

const handleLogin = async (email, password) => {
  try {
    await authApi.login(email, password);
    navigate('/dashboard');
  } catch (error) {
    setError(error.message);
  }
};

// Get user profile
import { userApi } from '../api/client';

const fetchProfile = async () => {
  try {
    const profile = await userApi.getProfile();
    setUser(profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

// Get strategies
import { strategyApi } from '../api/client';

const fetchStrategies = async () => {
  try {
    const strategies = await strategyApi.getStrategies();
    setStrategies(strategies);
  } catch (error) {
    console.error('Failed to fetch strategies:', error);
  }
};

// Create new strategy
const createStrategy = async (strategyData) => {
  try {
    const newStrategy = await strategyApi.createStrategy(strategyData);
    console.log('Strategy created:', newStrategy);
  } catch (error) {
    console.error('Failed to create strategy:', error);
  }
};
*/