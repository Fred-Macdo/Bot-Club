// src/components/dashboard/AlpacaConfigForm.js (completion)
import React, { useState } from 'react';
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
  useTheme 
} from '@mui/material';
import { useAlpaca } from '../../context/AlpacaContext';

const AlpacaConfigForm = () => {
  const theme = useTheme();
  const { saveAlpacaConfig, testAlpacaConnection } = useAlpaca();
  
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    endpoint: 'https://paper-api.alpaca.markets',
    isPaper: true
  });
  
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formStatus, setFormStatus] = useState(null);
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const handleSwitchChange = () => {
    const newIsPaper = !formData.isPaper;
    setFormData(prev => ({
      ...prev,
      isPaper: newIsPaper,
      endpoint: newIsPaper 
        ? 'https://paper-api.alpaca.markets/v2' 
        : 'https://api.alpaca.markets'
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.apiKey.trim()) {
      newErrors.apiKey = 'API Key is required';
    }
    
    if (!formData.apiSecret.trim()) {
      newErrors.apiSecret = 'API Secret is required';
    }
    
    if (!formData.endpoint.trim()) {
      newErrors.endpoint = 'API Endpoint is required';
    } else if (!formData.endpoint.startsWith('https://')) {
      newErrors.endpoint = 'Must be a valid HTTPS URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleTestConnection = async () => {
    if (!validateForm()) return;
    
    setTestingConnection(true);
    setFormStatus(null);
    
    try {
      const result = await testAlpacaConnection(formData);
      
      if (result.success) {
        setFormStatus({
          type: 'success',
          message: 'Connection successful! Alpaca API credentials are valid.'
        });
      } else {
        setFormStatus({
          type: 'error',
          message: result.error || 'Failed to connect to Alpaca API. Please check your credentials.'
        });
      }
    } catch (error) {
      setFormStatus({
        type: 'error',
        message: 'An error occurred while testing the connection.'
      });
      console.error('Error testing connection:', error);
    } finally {
      setTestingConnection(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setFormStatus(null);
    
    try {
      const result = await saveAlpacaConfig(formData);
      
      if (result.success) {
        setFormStatus({
          type: 'success',
          message: 'Alpaca API configuration saved successfully!'
        });
        // Reset form after successful submission
        setFormData({
          apiKey: '',
          apiSecret: '',
          endpoint: 'https://paper-api.alpaca.markets/v2',
          isPaper: true
        });
      } else {
        setFormStatus({
          type: 'error',
          message: result.error?.message || 'Failed to save Alpaca configuration.'
        });
      }
    } catch (error) {
      setFormStatus({
        type: 'error',
        message: 'An error occurred while saving the configuration.'
      });
      console.error('Error saving config:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="API Key"
            name="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            error={!!errors.apiKey}
            helperText={errors.apiKey}
            disabled={loading || testingConnection}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="API Secret"
            name="apiSecret"
            value={formData.apiSecret}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            type="password"
            error={!!errors.apiSecret}
            helperText={errors.apiSecret}
            disabled={loading || testingConnection}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="API Endpoint"
            name="endpoint"
            value={formData.endpoint}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            error={!!errors.endpoint}
            helperText={errors.endpoint || "e.g., https://paper-api.alpaca.markets"}
            disabled={loading || testingConnection}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isPaper}
                onChange={handleSwitchChange}
                name="isPaper"
                color="primary"
                disabled={loading || testingConnection}
              />
            }
            label="Paper Trading Account"
          />
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ ml: 1 }}
          >
            {formData.isPaper ? 'Using Paper Trading (Practice)' : 'Using Live Trading (Real Money)'}
          </Typography>
        </Grid>
      </Grid>
      
      {formStatus && (
        <Fade in={!!formStatus}>
          <Alert 
            severity={formStatus.type} 
            sx={{ mt: 2 }}
          >
            {formStatus.message}
          </Alert>
        </Fade>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleTestConnection}
          disabled={loading || testingConnection}
          startIcon={testingConnection && <CircularProgress size={16} />}
        >
          {testingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || testingConnection}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>
    </Box>
  );
};

export default AlpacaConfigForm;