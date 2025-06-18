import axios from 'axios';

// API configuration utility for Bot Club frontend
// Handles different environments: Docker, development, production

const getApiBaseUrl = () => {
  // Check if we're running in Docker environment
  const isDocker = process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.includes('backend:');
  
  // If running in Docker, use empty string to leverage proxy
  // Otherwise use the configured API URL or default to localhost
  const apiUrl = isDocker ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:8000');
  
  console.log('API Config - Environment:', process.env.NODE_ENV);
  console.log('API Config - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('API Config - Is Docker:', isDocker);
  console.log('API Config - Using baseURL:', apiUrl);
  
  return apiUrl;
};

const createApiConfig = () => {
  const baseURL = getApiBaseUrl();
  
  return {
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  };
};

// Get authorization headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create axios instance with proper configuration
const createApiInstance = () => {
  const config = createApiConfig();
  
  const instance = axios.create(config);
  
  // Add request interceptor to include auth token
  instance.interceptors.request.use(
    (config) => {
      const authHeaders = getAuthHeaders();
      config.headers = { ...config.headers, ...authHeaders };
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  return instance;
};

export {
  getApiBaseUrl,
  createApiConfig,
  getAuthHeaders,
  createApiInstance
};
