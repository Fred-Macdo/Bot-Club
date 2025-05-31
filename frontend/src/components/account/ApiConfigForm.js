import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControlLabel, 
  Switch, 
  CircularProgress, 
  Alert, 
  Grid, 
  Typography,
  Paper,
  Fade,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import TestIcon from '@mui/icons-material/Speed';
import SaveIcon from '@mui/icons-material/Save';
import { createApiInstance } from '../../utils/apiConfig';

const ApiConfigForm = () => {
  const [alpacaConfig, setAlpacaConfig] = useState({
    apiKey: '',
    apiSecret: '',
    endpoint: 'https://paper-api.alpaca.markets/v2',
    isPaper: true
  });

  const [polygonConfig, setPolygonConfig] = useState({
    apiKey: '',
    apiSecret: ''
  });

  const [loading, setLoading] = useState({
    alpaca: false,
    polygon: false,
    fetch: false
  });

  const [testing, setTesting] = useState({
    alpaca: false,
    polygon: false
  });

  const [status, setStatus] = useState({
    alpaca: null,
    polygon: null
  });

  const [errors, setErrors] = useState({
    alpaca: {},
    polygon: {}
  });

  const [expanded, setExpanded] = useState({
    alpaca: true,
    polygon: false
  });

  // Load existing configurations on component mount
  useEffect(() => {
    fetchExistingConfigs();
  }, []);

  const fetchExistingConfigs = async () => {
    setLoading(prev => ({ ...prev, fetch: true }));
    
    try {
      const api = createApiInstance();
      const response = await api.get('/api/user-config');
      
      if (response.data) {
        const { alpaca_api_key, alpaca_secret_key, polygon_api_key, polygon_secret_key } = response.data;
        
        if (alpaca_api_key) {
          setAlpacaConfig(prev => ({
            ...prev,
            apiKey: alpaca_api_key,
            apiSecret: alpaca_secret_key || ''
          }));
        }

        if (polygon_api_key) {
          setPolygonConfig({
            apiKey: polygon_api_key,
            apiSecret: polygon_secret_key || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      setStatus(prev => ({
        ...prev,
        alpaca: { type: 'info', message: 'No existing configuration found. Please add your API credentials.' }
      }));
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  };

  const handleAlpacaChange = (e) => {
    const { name, value } = e.target;
    setAlpacaConfig(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors.alpaca[name]) {
      setErrors(prev => ({
        ...prev,
        alpaca: { ...prev.alpaca, [name]: null }
      }));
    }
  };

  const handlePolygonChange = (e) => {
    const { name, value } = e.target;
    setPolygonConfig(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors.polygon[name]) {
      setErrors(prev => ({
        ...prev,
        polygon: { ...prev.polygon, [name]: null }
      }));
    }
  };

  const handleAlpacaSwitchChange = () => {
    const newIsPaper = !alpacaConfig.isPaper;
    setAlpacaConfig(prev => ({
      ...prev,
      isPaper: newIsPaper,
      endpoint: newIsPaper 
        ? 'https://paper-api.alpaca.markets/v2' 
        : 'https://api.alpaca.markets/v2'
    }));
  };

  const validateAlpacaForm = () => {
    const newErrors = {};
    
    if (!alpacaConfig.apiKey.trim()) {
      newErrors.apiKey = 'Alpaca API Key is required';
    }
    
    if (!alpacaConfig.apiSecret.trim()) {
      newErrors.apiSecret = 'Alpaca API Secret is required';
    }
    
    if (!alpacaConfig.endpoint.trim()) {
      newErrors.endpoint = 'API Endpoint is required';
    } else if (!alpacaConfig.endpoint.startsWith('https://')) {
      newErrors.endpoint = 'Must be a valid HTTPS URL';
    }
    
    setErrors(prev => ({ ...prev, alpaca: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validatePolygonForm = () => {
    const newErrors = {};
    
    if (!polygonConfig.apiKey.trim()) {
      newErrors.apiKey = 'Polygon API Key is required';
    }
    
    setErrors(prev => ({ ...prev, polygon: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const testAlpacaConnection = async () => {
    if (!validateAlpacaForm()) return;
    
    setTesting(prev => ({ ...prev, alpaca: true }));
    setStatus(prev => ({ ...prev, alpaca: null }));
    
    try {
      const api = createApiInstance();
      const response = await api.post('/api/user-config/test-alpaca', {
        apiKey: alpacaConfig.apiKey,
        apiSecret: alpacaConfig.apiSecret,
        endpoint: alpacaConfig.endpoint
      });
      
      if (response.data.success) {
        setStatus(prev => ({
          ...prev,
          alpaca: {
            type: 'success',
            message: `Alpaca connection successful! Account: ${response.data.account_info?.account_number || 'N/A'}`
          }
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          alpaca: {
            type: 'error',
            message: response.data.error || 'Failed to connect to Alpaca API'
          }
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'error',
          message: error.response?.data?.message || 'Error testing Alpaca connection'
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, alpaca: false }));
    }
  };

  const testPolygonConnection = async () => {
    if (!validatePolygonForm()) return;
    
    setTesting(prev => ({ ...prev, polygon: true }));
    setStatus(prev => ({ ...prev, polygon: null }));
    
    try {
      const api = createApiInstance();
      const response = await api.post('/api/user-config/test-polygon', {
        apiKey: polygonConfig.apiKey,
        apiSecret: polygonConfig.apiSecret
      });
      
      if (response.data.success) {
        setStatus(prev => ({
          ...prev,
          polygon: {
            type: 'success',
            message: 'Polygon connection successful!'
          }
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          polygon: {
            type: 'error',
            message: response.data.error || 'Failed to connect to Polygon API'
          }
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        polygon: {
          type: 'error',
          message: error.response?.data?.message || 'Error testing Polygon connection'
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, polygon: false }));
    }
  };

  const saveAlpacaConfig = async () => {
    if (!validateAlpacaForm()) return;
    
    setLoading(prev => ({ ...prev, alpaca: true }));
    setStatus(prev => ({ ...prev, alpaca: null }));
    
    try {
      const api = createApiInstance();
      const response = await api.post('/api/user-config/alpaca', {
        alpaca_api_key: alpacaConfig.apiKey,
        alpaca_secret_key: alpacaConfig.apiSecret,
        alpaca_endpoint: alpacaConfig.endpoint,
        alpaca_is_paper: alpacaConfig.isPaper
      });
      
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'success',
          message: 'Alpaca configuration saved successfully!'
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'error',
          message: error.response?.data?.message || 'Failed to save Alpaca configuration'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, alpaca: false }));
    }
  };

  const savePolygonConfig = async () => {
    if (!validatePolygonForm()) return;
    
    setLoading(prev => ({ ...prev, polygon: true }));
    setStatus(prev => ({ ...prev, polygon: null }));
    
    try {
      const api = createApiInstance();
      const response = await api.post('/api/user-config/polygon', {
        polygon_api_key: polygonConfig.apiKey,
        polygon_secret_key: polygonConfig.apiSecret
      });
      
      setStatus(prev => ({
        ...prev,
        polygon: {
          type: 'success',
          message: 'Polygon configuration saved successfully!'
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        polygon: {
          type: 'error',
          message: error.response?.data?.message || 'Failed to save Polygon configuration'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, polygon: false }));
    }
  };

  const deleteAlpacaConfig = async () => {
    setLoading(prev => ({ ...prev, alpaca: true }));
    
    try {
      const api = createApiInstance();
      await api.delete('/api/user-config/alpaca');
      
      setAlpacaConfig({
        apiKey: '',
        apiSecret: '',
        endpoint: 'https://paper-api.alpaca.markets/v2',
        isPaper: true
      });
      
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'success',
          message: 'Alpaca configuration deleted successfully!'
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'error',
          message: 'Failed to delete Alpaca configuration'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, alpaca: false }));
    }
  };

  const deletePolygonConfig = async () => {
    setLoading(prev => ({ ...prev, polygon: true }));
    
    try {
      const api = createApiInstance();
      await api.delete('/api/user-config/polygon');
      
      setPolygonConfig({
        apiKey: '',
        apiSecret: ''
      });
      
      setStatus(prev => ({
        ...prev,
        polygon: {
          type: 'success',
          message: 'Polygon configuration deleted successfully!'
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        polygon: {
          type: 'error',
          message: 'Failed to delete Polygon configuration'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, polygon: false }));
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(prev => ({
      ...prev,
      [panel]: isExpanded
    }));
  };

  if (loading.fetch) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading configurations...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        API Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your trading and data provider API credentials. All credentials are securely encrypted.
      </Typography>

      {/* Alpaca Configuration */}
      <Accordion 
        expanded={expanded.alpaca} 
        onChange={handleAccordionChange('alpaca')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            Alpaca Trading API
            {alpacaConfig.apiKey && (
              <Typography variant="body2" color="success.main" sx={{ ml: 2 }}>
                ✓ Configured
              </Typography>
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Key"
                name="apiKey"
                value={alpacaConfig.apiKey}
                onChange={handleAlpacaChange}
                margin="normal"
                variant="outlined"
                error={!!errors.alpaca.apiKey}
                helperText={errors.alpaca.apiKey}
                disabled={loading.alpaca || testing.alpaca}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Secret"
                name="apiSecret"
                value={alpacaConfig.apiSecret}
                onChange={handleAlpacaChange}
                margin="normal"
                variant="outlined"
                type="password"
                error={!!errors.alpaca.apiSecret}
                helperText={errors.alpaca.apiSecret}
                disabled={loading.alpaca || testing.alpaca}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="API Endpoint"
                name="endpoint"
                value={alpacaConfig.endpoint}
                onChange={handleAlpacaChange}
                margin="normal"
                variant="outlined"
                error={!!errors.alpaca.endpoint}
                helperText={errors.alpaca.endpoint || "API endpoint URL"}
                disabled={loading.alpaca || testing.alpaca}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={alpacaConfig.isPaper}
                    onChange={handleAlpacaSwitchChange}
                    name="isPaper"
                    color="primary"
                    disabled={loading.alpaca || testing.alpaca}
                  />
                }
                label="Paper Trading"
              />
            </Grid>
          </Grid>

          {status.alpaca && (
            <Fade in={!!status.alpaca}>
              <Alert severity={status.alpaca.type} sx={{ mt: 2 }}>
                {status.alpaca.message}
              </Alert>
            </Fade>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={testAlpacaConnection}
              disabled={loading.alpaca || testing.alpaca}
              startIcon={testing.alpaca ? <CircularProgress size={16} /> : <TestIcon />}
            >
              {testing.alpaca ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button
              variant="contained"
              onClick={saveAlpacaConfig}
              disabled={loading.alpaca || testing.alpaca}
              startIcon={loading.alpaca ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {loading.alpaca ? 'Saving...' : 'Save Configuration'}
            </Button>

            {alpacaConfig.apiKey && (
              <Button
                variant="outlined"
                color="error"
                onClick={deleteAlpacaConfig}
                disabled={loading.alpaca || testing.alpaca}
                startIcon={<DeleteIcon />}
              >
                Delete Configuration
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Polygon Configuration */}
      <Accordion 
        expanded={expanded.polygon} 
        onChange={handleAccordionChange('polygon')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            Polygon.io Data API
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              (Optional - for enhanced backtesting data)
            </Typography>
            {polygonConfig.apiKey && (
              <Typography variant="body2" color="success.main" sx={{ ml: 2 }}>
                ✓ Configured
              </Typography>
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Polygon API Key"
                name="apiKey"
                value={polygonConfig.apiKey}
                onChange={handlePolygonChange}
                margin="normal"
                variant="outlined"
                error={!!errors.polygon.apiKey}
                helperText={errors.polygon.apiKey || "Your Polygon.io API key"}
                disabled={loading.polygon || testing.polygon}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Polygon API Secret (Optional)"
                name="apiSecret"
                value={polygonConfig.apiSecret}
                onChange={handlePolygonChange}
                margin="normal"
                variant="outlined"
                type="password"
                error={!!errors.polygon.apiSecret}
                helperText={errors.polygon.apiSecret || "Optional secret key"}
                disabled={loading.polygon || testing.polygon}
              />
            </Grid>
          </Grid>

          {status.polygon && (
            <Fade in={!!status.polygon}>
              <Alert severity={status.polygon.type} sx={{ mt: 2 }}>
                {status.polygon.message}
              </Alert>
            </Fade>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={testPolygonConnection}
              disabled={loading.polygon || testing.polygon}
              startIcon={testing.polygon ? <CircularProgress size={16} /> : <TestIcon />}
            >
              {testing.polygon ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button
              variant="contained"
              onClick={savePolygonConfig}
              disabled={loading.polygon || testing.polygon}
              startIcon={loading.polygon ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {loading.polygon ? 'Saving...' : 'Save Configuration'}
            </Button>

            {polygonConfig.apiKey && (
              <Button
                variant="outlined"
                color="error"
                onClick={deletePolygonConfig}
                disabled={loading.polygon || testing.polygon}
                startIcon={<DeleteIcon />}
              >
                Delete Configuration
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ApiConfigForm;