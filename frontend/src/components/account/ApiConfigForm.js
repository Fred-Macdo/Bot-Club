import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Api as TestIcon
} from '@mui/icons-material';
import { userConfigApi } from '../../api/Client';
import { testAlpacaConnection, testPolygonConnection } from '../../utils/apiTesting';

const ApiConfigForm = () => {
  // Separate configurations for paper and live accounts
  const [paperConfig, setPaperConfig] = useState({
    apiKey: '',
    apiSecret: '',
    endpoint: 'https://paper-api.alpaca.markets/v2'
  });

  const [liveConfig, setLiveConfig] = useState({
    apiKey: '',
    apiSecret: '',
    endpoint: 'https://api.alpaca.markets/v2'
  });

  const [isPaperMode, setIsPaperMode] = useState(true);

  // Current active config (computed based on isPaperMode)
  const currentConfig = isPaperMode ? paperConfig : liveConfig;

  const [polygonConfig, setPolygonConfig] = useState({
    apiKeyName: '',
    apiKey: ''
  });

  const [loading, setLoading] = useState({
    fetch: false,
    alpaca: false,
    polygon: false,
    testAlpaca: false,
    testPolygon: false
  });

  const [status, setStatus] = useState({
    alpaca: null,
    polygon: null,
    testAlpaca: null,
    testPolygon: null
  });

  const [errors, setErrors] = useState({
    alpaca: {},
    polygon: {}
  });

  const [expanded, setExpanded] = useState({
    alpaca: false,
    polygon: false
  });

  const [testing, setTesting] = useState({
    alpaca: false,
    polygon: false
  });

  // Load existing configurations on component mount
  useEffect(() => {
    fetchExistingConfigs();
  }, []);

  const fetchExistingConfigs = async () => {
    setLoading(prev => ({ ...prev, fetch: true }));
    
    try {
      const response = await userConfigApi.getConfig();
      
      if (response) {
        const { 
          alpaca_paper_api_key,
          alpaca_paper_secret_key,
          alpaca_paper_endpoint,
          alpaca_live_api_key,
          alpaca_live_secret_key,
          alpaca_live_endpoint,
          polygon_api_key_name,
          polygon_secret_key 
        } = response;
        
        // Load paper config
        if (alpaca_paper_api_key) {
          setPaperConfig({
            apiKey: alpaca_paper_api_key,
            apiSecret: alpaca_paper_secret_key || '',
            endpoint: alpaca_paper_endpoint || 'https://paper-api.alpaca.markets/v2'
          });
        }

        // Load live config
        if (alpaca_live_api_key) {
          setLiveConfig({
            apiKey: alpaca_live_api_key,
            apiSecret: alpaca_live_secret_key || '',
            endpoint: alpaca_live_endpoint || 'https://api.alpaca.markets/v2'
          });
        }

        if (polygon_api_key_name) {
          setPolygonConfig({
            apiKeyName: polygon_api_key_name,
            apiKey: polygon_secret_key || ''
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
    
    if (isPaperMode) {
      setPaperConfig(prev => ({ ...prev, [name]: value }));
    } else {
      setLiveConfig(prev => ({ ...prev, [name]: value }));
    }
    
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
    setIsPaperMode(prev => !prev);
  };

  const validateAlpacaForm = () => {
    const newErrors = {};
    const config = currentConfig;
    
    if (!config.apiKey.trim()) {
      newErrors.apiKey = 'Alpaca API Key is required';
    }
    
    if (!config.apiSecret.trim()) {
      newErrors.apiSecret = 'Alpaca API Secret is required';
    }
    
    if (!config.endpoint.trim()) {
      newErrors.endpoint = 'API Endpoint is required';
    } else if (!config.endpoint.startsWith('https://')) {
      newErrors.endpoint = 'Must be a valid HTTPS URL';
    }
    
    setErrors(prev => ({ ...prev, alpaca: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validatePolygonForm = () => {
    const newErrors = {};
    
    if (!polygonConfig.apiKeyName.trim()) {
      newErrors.apiKeyName = 'Polygon API Key Name is required';
    }
    
    if (!polygonConfig.apiKey.trim()) {
      newErrors.apiKey = 'Polygon API Key is required';
    }
    
    setErrors(prev => ({ ...prev, polygon: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const testAlpacaAPI = async () => {
    if (!validateAlpacaForm()) return;
    
    setTesting(prev => ({ ...prev, alpaca: true }));
    setLoading(prev => ({ ...prev, testAlpaca: true }));
    setStatus(prev => ({ ...prev, testAlpaca: null }));
    
    try {
      const result = await testAlpacaConnection(
        currentConfig.apiKey,
        currentConfig.apiSecret,
        currentConfig.endpoint
      );
      
      if (result.success) {
        const accountStatus = result.data?.status || 'Unknown';
        const cryptoStatus = result.data?.crypto_status || 'Unknown';
        const accountNumber = result.data?.account_number || 'Unknown';
        
        const isActive = accountStatus.toLowerCase() === 'active';
        
        setStatus(prev => ({
          ...prev,
          testAlpaca: {
            type: 'success',
            message: `Connection successful! Account Status: ${isActive ? 'Active' : 'Inactive'}`,
            details: result.data
          }
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          testAlpaca: {
            type: 'error',
            message: result.error
          }
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        testAlpaca: {
          type: 'error',
          message: `Test failed: ${error.message}`
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, alpaca: false }));
      setLoading(prev => ({ ...prev, testAlpaca: false }));
    }
  };

  const testPolygonAPI = async () => {
    if (!validatePolygonForm()) return;
    
    setTesting(prev => ({ ...prev, polygon: true }));
    setLoading(prev => ({ ...prev, testPolygon: true }));
    setStatus(prev => ({ ...prev, testPolygon: null }));
    
    try {
      const result = await testPolygonConnection(polygonConfig.apiKey);
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          testPolygon: {
            type: 'success',
            message: result.message,
            details: result.data
          }
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          testPolygon: {
            type: 'error',
            message: result.error
          }
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        testPolygon: {
          type: 'error',
          message: `Test failed: ${error.message}`
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, polygon: false }));
      setLoading(prev => ({ ...prev, testPolygon: false }));
    }
  };

  const saveAlpacaConfig = async () => {
    if (!validateAlpacaForm()) return;
    
    setLoading(prev => ({ ...prev, alpaca: true }));
    setStatus(prev => ({ ...prev, alpaca: null }));
    
    try {
      const configData = isPaperMode ? {
        alpaca_paper_api_key: currentConfig.apiKey,
        alpaca_paper_secret_key: currentConfig.apiSecret,
        alpaca_paper_endpoint: currentConfig.endpoint
      } : {
        alpaca_live_api_key: currentConfig.apiKey,
        alpaca_live_secret_key: currentConfig.apiSecret,
        alpaca_live_endpoint: currentConfig.endpoint
      };

      const response = await userConfigApi.saveAlpacaConfig(configData);
      
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'success',
          message: `Alpaca ${isPaperMode ? 'Paper' : 'Live'} configuration saved successfully!`
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'error',
          message: error.message || `Failed to save Alpaca ${isPaperMode ? 'Paper' : 'Live'} configuration`
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
      const response = await userConfigApi.savePolygonConfig({
        polygon_api_key_name: polygonConfig.apiKeyName,
        polygon_secret_key: polygonConfig.apiKey
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
          message: error.message || 'Failed to save Polygon configuration'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, polygon: false }));
    }
  };

  const deleteAlpacaConfig = async () => {
    setLoading(prev => ({ ...prev, alpaca: true }));
    
    try {
      await userConfigApi.deleteAlpacaConfig();
      
      if (isPaperMode) {
        setPaperConfig({
          apiKey: '',
          apiSecret: '',
          endpoint: 'https://paper-api.alpaca.markets/v2'
        });
      } else {
        setLiveConfig({
          apiKey: '',
          apiSecret: '',
          endpoint: 'https://api.alpaca.markets/v2'
        });
      }
      
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'success',
          message: `Alpaca ${isPaperMode ? 'Paper' : 'Live'} configuration deleted successfully!`
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        alpaca: {
          type: 'error',
          message: `Failed to delete Alpaca ${isPaperMode ? 'Paper' : 'Live'} configuration`
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, alpaca: false }));
    }
  };

  const deletePolygonConfig = async () => {
    setLoading(prev => ({ ...prev, polygon: true }));
    
    try {
      await userConfigApi.deletePolygonConfig();
      
      setPolygonConfig({
        apiKeyName: '',
        apiKey: ''
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

  // Create table data for configured accounts
  const getConfiguredAccounts = () => {
    const accounts = [];
    
    // Paper Trading Account
    if (paperConfig.apiKey) {
      accounts.push({
        type: 'Paper Trading',
        status: 'Configured',
        endpoint: paperConfig.endpoint,
        apiKey: paperConfig.apiKey.substring(0, 8) + '...'
      });
    } else {
      accounts.push({
        type: 'Paper Trading',
        status: 'Not Configured',
        endpoint: 'https://paper-api.alpaca.markets/v2',
        apiKey: '—'
      });
    }
    
    // Live Trading Account
    if (liveConfig.apiKey) {
      accounts.push({
        type: 'Live Trading',
        status: 'Configured',
        endpoint: liveConfig.endpoint,
        apiKey: liveConfig.apiKey.substring(0, 8) + '...'
      });
    } else {
      accounts.push({
        type: 'Live Trading',
        status: 'Not Configured',
        endpoint: 'https://api.alpaca.markets/v2',
        apiKey: '—'
      });
    }
    
    return accounts;
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
            {(paperConfig.apiKey || liveConfig.apiKey) && (
              <Typography variant="body2" color="success.main" sx={{ ml: 2 }}>
                ✓ Configured
              </Typography>
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* Account Configuration Table */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Account Status
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Account Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>API Key</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getConfiguredAccounts().map((account, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip 
                          label={account.type} 
                          color={account.type === 'Paper Trading' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={account.status} 
                          color={account.status === 'Configured' ? 'success' : 'default'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {account.endpoint}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {account.apiKey}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Current Configuration Form */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPaperMode}
                  onChange={handleAlpacaSwitchChange}
                  name="isPaper"
                  color="primary"
                  disabled={loading.alpaca || testing.alpaca}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>
                    {isPaperMode ? 'Paper Trading' : 'Live Trading'}
                  </Typography>
                  <Chip 
                    label={isPaperMode ? 'Paper' : 'Live'} 
                    color={isPaperMode ? 'primary' : 'secondary'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Key"
                name="apiKey"
                value={currentConfig.apiKey}
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
                value={currentConfig.apiSecret}
                onChange={handleAlpacaChange}
                margin="normal"
                variant="outlined"
                type="password"
                error={!!errors.alpaca.apiSecret}
                helperText={errors.alpaca.apiSecret}
                disabled={loading.alpaca || testing.alpaca}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Endpoint"
                name="endpoint"
                value={currentConfig.endpoint}
                onChange={handleAlpacaChange}
                margin="normal"
                variant="outlined"
                error={!!errors.alpaca.endpoint}
                helperText={errors.alpaca.endpoint || "API endpoint URL"}
                disabled={loading.alpaca || testing.alpaca}
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

          {status.testAlpaca && (
            <Fade in={!!status.testAlpaca}>
              <Alert severity={status.testAlpaca.type} sx={{ mt: 2 }}>
                {status.testAlpaca.message}
                {status.testAlpaca.details?.crypto_status && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Crypto Status:</strong> {status.testAlpaca.details.crypto_status}
                  </div>
                )}
                {status.testAlpaca.details?.account_number && (
                  <div style={{ marginTop: '4px' }}>
                    <strong>Account:</strong> {status.testAlpaca.details.account_number}
                  </div>
                )}
              </Alert>
            </Fade>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={testAlpacaAPI}
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
              {loading.alpaca ? 'Saving...' : `Save ${isPaperMode ? 'Paper' : 'Live'} Configuration`}
            </Button>

            {currentConfig.apiKey && (
              <Button
                variant="outlined"
                color="error"
                onClick={deleteAlpacaConfig}
                disabled={loading.alpaca || testing.alpaca}
                startIcon={<DeleteIcon />}
              >
                Delete {isPaperMode ? 'Paper' : 'Live'} Configuration
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Polygon Configuration - keeping the existing implementation */}
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
                label="Polygon API Key Name"
                name="apiKeyName"
                value={polygonConfig.apiKeyName}
                onChange={handlePolygonChange}
                margin="normal"
                variant="outlined"
                error={!!errors.polygon.apiKeyName}
                helperText={errors.polygon.apiKeyName || "Your Polygon.io API key name"}
                disabled={loading.polygon || testing.polygon}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Polygon API Key"
                name="apiKey"
                value={polygonConfig.apiKey}
                onChange={handlePolygonChange}
                margin="normal"
                variant="outlined"
                type="password"
                error={!!errors.polygon.apiKey}
                helperText={errors.polygon.apiKey || "Required secret key"}
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

          {status.testPolygon && (
            <Fade in={!!status.testPolygon}>
              <Alert severity={status.testPolygon.type} sx={{ mt: 2 }}>
                {status.testPolygon.message}
              </Alert>
            </Fade>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={testPolygonAPI}
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