// frontend/src/api/client.js
// Consolidated API Client - Single source of truth for all API communications

class ApiClient {
  constructor() {
    // Check if we're running in Docker environment
    const isDocker = process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.includes('backend:');
    
    // If running in Docker, use empty string to leverage proxy
    // Otherwise use the configured API URL or default to localhost
    this.baseURL = isDocker ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:8000');
    this.tokenKey = 'authToken'; // Consistent token key across the application
    
    console.log('ApiClient initialized:', {
      environment: process.env.NODE_ENV,
      apiUrl: process.env.REACT_APP_API_URL,
      isDocker,
      baseURL: this.baseURL
    });
  }

  // Token management methods
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
      console.log('Token stored successfully');
    } else {
      console.warn('Attempted to set null/undefined token');
    }
  }

  removeToken() {
    localStorage.removeItem(this.tokenKey);
    console.log('Token removed from storage');
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
  }

  // Base request method with comprehensive error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    // Build headers - don't set Content-Type for FormData
    const headers = { ...options.headers };
    
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
        // Dispatch custom event for auth failure
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: 'Token expired' }));
        throw new Error('Authentication failed');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          
          // Handle FastAPI validation errors (422)
          if (response.status === 422 && errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail
                .map(err => {
                  const location = err.loc ? err.loc.join('.') : 'field';
                  return `${location}: ${err.msg}`;
                })
                .join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          } else {
            errorMessage = errorData.detail || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
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
        error: error.message
      });
      throw error;
    }
  }

  // HTTP method shortcuts
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

  // Special method for form data (used in login)
  async postForm(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// 🔐 AUTHENTICATION API
export const authApi = {
  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.postForm('/api/auth/token', formData);
      // Save token automatically on successful login
    if (response?.access_token) {
      apiClient.setToken(response.access_token);
    }
    
    return response;
  },
  
  async register(userData) {
    return apiClient.post('/api/auth/register', userData);
  },

  async getUserProfile() {
    return apiClient.get('/api/users/me');
  },

  async updateUserProfile(userData) {
    return apiClient.put('/api/users/me', userData);
  },

  logout() {
    apiClient.removeToken();
    // Dispatch logout event for components to listen to
    window.dispatchEvent(new CustomEvent('auth:logout', { detail: 'User logged out' }));
  },

  isAuthenticated() {
    return apiClient.isAuthenticated();
  }
};

// 👤 USER API
export const userApi = {
  async getProfile() {
    return apiClient.get('/api/users/me');
  },

  async updateProfile(userData) {
    return apiClient.put('/api/users/me', userData);
  },
};

// 📈 STRATEGY API - Comprehensive strategy management
export const strategyApi = {
  // Get all strategies (user's strategies)
  async getUserStrategies() {
    return apiClient.get('/api/strategy/user_strategies');
  },
  // Get default/template strategies
  async getDefaultStrategies() {
    return apiClient.get('/api/strategy/default');
  },

  async getDefaultStrategiesWithIds() {
    return apiClient.get('/api/strategy/defaults/with-ids');
  },

  // Get single strategy by ID
  async getStrategy(strategyId) {
    return apiClient.get(`/api/strategy/${strategyId}`);
  },

  // Create new strategy
  async createStrategy(strategyData) {
    return apiClient.post('/api/strategy', strategyData);
  },

  // Update existing strategy
  async updateStrategy(strategyId, strategyData) {
    return apiClient.put(`/api/strategy/${strategyId}`, strategyData);
  },

  // Delete strategy
  async deleteStrategy(strategyId) {
    return apiClient.delete(`/api/strategy/${strategyId}`);
  },

  // Toggle strategy active/inactive status
  async toggleStrategy(strategyId, isActive) {
    return apiClient.post(`/api/strategy/${strategyId}/toggle`, { is_active: isActive });
  },

  // Backtest operations
  async startBacktest(strategyId, params) {
    console.log('Starting backtest for strategy:', strategyId, 'with params:', params);
    return apiClient.post(`/api/strategy/${strategyId}/backtest`, params);
  },

  async getBacktestResults(strategyId) {
    return apiClient.get(`/api/strategy/${strategyId}/backtest`);
  },

  async getBacktestResult(strategyId, backtestId) {
    return apiClient.get(`/api/strategy/${strategyId}/backtest/${backtestId}`);
  }
};

// 🚀 BACKTEST API (for direct backtest operations)
export const backtestApi = {
  async runBacktest(backtestData) {
    console.log("backtestAPI -> Running backtest with data:", backtestData);

    // Dynamically determine strategy_type if not provided
    if (!backtestData.strategy_type) {
      try {
        const defaultStrategies = await strategyApi.getDefaultStrategiesWithIds();
        const isDefault = defaultStrategies.some(s => s.id === backtestData.strategy_id);
        backtestData.strategy_type = isDefault ? 'default' : 'user';
        console.log(`Determined strategy_type: ${backtestData.strategy_type}`);
      } catch (error) {
        console.error("Could not determine strategy type, defaulting to 'user'", error);
        backtestData.strategy_type = 'user'; // Default to user if check fails
      }
    }

    return apiClient.post('/api/backtest/run', backtestData);
  },

  async getBacktestStatus(backtestId) {
    return apiClient.get(`/api/backtest/status/${backtestId}`);
  },

  async getUserBacktests() {
    return apiClient.get('/api/backtest/user');
  },

  async getBacktestById(backtestId) {
    return apiClient.get(`/api/backtest/${backtestId}`);
  }
};

// 🔧 USER CONFIG API
export const userConfigApi = {
  async getConfig() {
    return apiClient.get('/api/user-config/');
  },

  async saveAlpacaConfig(configData) {
    return apiClient.post('/api/user-config/alpaca', configData);
  },

  async savePolygonConfig(configData) {
    return apiClient.post('/api/user-config/polygon', configData);
  },

  async deleteAlpacaConfig() {
    return apiClient.delete('/api/user-config/alpaca');
  },

  async deletePolygonConfig() {
    return apiClient.delete('/api/user-config/polygon');
  }
};

// 📊 TRADING API
export const tradingApi = {
  async getPortfolio() {
    return apiClient.get('/api/trading/portfolio');
  },

  async getTradingHistory(limit = 50, offset = 0) {
    return apiClient.get(`/api/trading/history?limit=${limit}&offset=${offset}`);
  },

  async getActivePositions() {
    return apiClient.get('/api/trading/positions');
  },

  async getPerformanceMetrics(timeframe = '30d') {
    return apiClient.get(`/api/trading/performance?timeframe=${timeframe}`);
  }
};

// 📈 MARKET DATA API
export const marketApi = {
  async getMarketData(symbols, timeframe = '1d') {
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    return apiClient.get(`/api/market/data?symbols=${symbolsParam}&timeframe=${timeframe}`);
  },

  async getAvailableSymbols() {
    return apiClient.get('/api/market/symbols');
  },

  async getMarketIndicators(symbol, indicators) {
    const indicatorsParam = Array.isArray(indicators) ? indicators.join(',') : indicators;
    return apiClient.get(`/api/market/indicators?symbol=${symbol}&indicators=${indicatorsParam}`);
  }
};

// 🔑 COMPATIBILITY LAYER - For smooth migration from APIServiceLayer.js
// These exports maintain backward compatibility while components are migrated
export const saveStrategy = async (strategyData, userId) => {
  try {
    const response = await strategyApi.createStrategy(strategyData);
    return { success: true, strategy: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchDefaultStrategies = async () => {
  try {
    const strategies = await strategyApi.getDefaultStrategies();
    return { success: true, strategies };
  } catch (error) {
    return { success: false, error: error.message, strategies: [] };
  }
};

export const fetchUserStrategies = async (userId) => {
  try {
    const strategies = await strategyApi.getUserStrategies();
    console.log('Fetched user strategies:', strategies);
    return { success: true, strategies };
  } catch (error) {
    console.log('Error fetching user strategies:', error);
    return { success: false, error: error.message, strategies: [] };
  }
};

// Export default client for any custom requests
export default apiClient;