import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Tabs, 
  Tab, 
  Paper,
  TextField,
  Divider,
  IconButton,
  useTheme,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { 
  Save as SaveIcon, 
  PlayArrow as RunIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';

// Strategy Builder Main Page
const StrategyBuilderPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [strategyName, setStrategyName] = useState('New Strategy');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [yamlConfig, setYamlConfig] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedStrategies, setSavedStrategies] = useState([]);

  // Strategy Configuration State
  const [strategyConfig, setStrategyConfig] = useState({
    symbols: ["AAPL", "MSFT", "GOOG"],
    timeframe: "1d",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    entry_conditions: [
      {
        indicator: "ema_5",
        comparison: "crosses_above",
        value: "sma_20"
      }
    ],
    exit_conditions: [
      {
        indicator: "rsi",
        comparison: "crosses_above",
        value: "70"
      }
    ],
    risk_management: {
      position_sizing_method: "risk_based",
      risk_per_trade: 0.25,
      stop_loss: 0.10,
      take_profit: 0.20,
      max_position_size: 1000.0,
      atr_multiplier: 2.0
    },
    indicators: [
      {
        name: "SMA",
        params: {
          period: 20
        }
      },
      {
        name: "EMA",
        params: {
          period: 5
        }
      },
      {
        name: "RSI",
        params: {
          period: 14
        }
      }
    ]
  });

  // Fetch saved strategies on component mount
  useEffect(() => {
    // Mock API call - replace with actual API call when backend is ready
    const fetchStrategies = async () => {
      try {
        // This would be an API call to your backend
        // const response = await fetch('/api/strategies');
        // const data = await response.json();
        // setSavedStrategies(data.strategies);

        // Mock data for now
        setSavedStrategies([
          { id: '1', name: 'EMA Crossover Strategy', description: 'Basic EMA crossover with RSI filter' },
          { id: '2', name: 'Bollinger Bands Strategy', description: 'Bollinger Bands mean reversion' },
          { id: '3', name: 'MACD with ATR Strategy', description: 'MACD signals with ATR position sizing' }
        ]);
      } catch (error) {
        console.error('Error fetching strategies:', error);
      }
    };

    fetchStrategies();
  }, []);

  // Generate YAML from strategy config
  useEffect(() => {
    const generateYaml = () => {
      let yaml = '';
      
      // Symbols
      yaml += `symbols: [${strategyConfig.symbols.map(s => `"${s}"`).join(', ')}]\n`;
      
      // Timeframe
      yaml += `timeframe: "${strategyConfig.timeframe}"\n`;
      
      // Dates
      yaml += `start_date: "${strategyConfig.start_date}"\n`;
      yaml += `end_date: "${strategyConfig.end_date}"\n\n`;
      
      // Entry conditions
      yaml += "# Entry conditions\n";
      yaml += "entry_conditions:\n";
      strategyConfig.entry_conditions.forEach(condition => {
        yaml += `  - indicator: "${condition.indicator}"\n`;
        yaml += `    comparison: "${condition.comparison}"\n`;
        yaml += `    value: ${isNaN(condition.value) ? `"${condition.value}"` : condition.value}\n`;
      });
      yaml += "\n";
      
      // Exit conditions
      yaml += "# Exit conditions\n";
      yaml += "exit_conditions:\n";
      strategyConfig.exit_conditions.forEach(condition => {
        yaml += `  - indicator: "${condition.indicator}"\n`;
        yaml += `    comparison: "${condition.comparison}"\n`;
        yaml += `    value: ${isNaN(condition.value) ? `"${condition.value}"` : condition.value}\n`;
      });
      yaml += "\n";
      
      // Risk management
      yaml += "# Risk management parameters\n";
      yaml += "risk_management:\n";
      Object.entries(strategyConfig.risk_management).forEach(([key, value]) => {
        yaml += `  ${key}: ${value}\n`;
      });
      yaml += "\n";
      
      // Indicators
      yaml += "# Required indicators\n";
      yaml += "indicators:\n";
      strategyConfig.indicators.forEach(indicator => {
        yaml += `  - name: "${indicator.name}"\n`;
        yaml += "    params:\n";
        Object.entries(indicator.params).forEach(([key, value]) => {
          yaml += `      ${key}: ${value}\n`;
        });
      });
      
      setYamlConfig(yaml);
    };

    generateYaml();
  }, [strategyConfig]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Open YAML editor
  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  // Close YAML editor
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  // Apply YAML changes
  const handleApplyYaml = () => {
    // Here you would parse the YAML to update the strategyConfig
    // For simplicity, just closing the editor for now
    setIsEditorOpen(false);
  };

  // Save strategy
  const handleSaveStrategy = () => {
    // Mock API call - replace with actual API call when backend is ready
    // This would be an API call to your backend to save the strategy
    // fetch('/api/strategies', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     name: strategyName,
    //     config: strategyConfig
    //   }),
    // })
    //   .then(response => response.json())
    //   .then(data => {
    //     setSaveSuccess(true);
    //   })
    //   .catch(error => {
    //     console.error('Error saving strategy:', error);
    //   });

    // Mock successful save
    setSaveSuccess(true);
    
    // Auto-hide the success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Load a saved strategy
  const handleLoadStrategy = (strategyId) => {
    // This would be an API call to your backend to load the strategy
    // fetch(`/api/strategies/${strategyId}`)
    //   .then(response => response.json())
    //   .then(data => {
    //     setStrategyName(data.name);
    //     setStrategyConfig(data.config);
    //   })
    //   .catch(error => {
    //     console.error('Error loading strategy:', error);
    //   });

    // Mock load strategy
    const strategy = savedStrategies.find(s => s.id === strategyId);
    if (strategy) {
      setStrategyName(strategy.name);
      // In a real app, you would load the actual config
    }
  };

  // Update symbol list
  const handleUpdateSymbols = (newSymbols) => {
    setStrategyConfig(prev => ({
      ...prev,
      symbols: newSymbols
    }));
  };

  // Add entry condition
  const handleAddEntryCondition = () => {
    setStrategyConfig(prev => ({
      ...prev,
      entry_conditions: [
        ...prev.entry_conditions,
        {
          indicator: "close",
          comparison: "above",
          value: "sma_20"
        }
      ]
    }));
  };

  // Add exit condition
  const handleAddExitCondition = () => {
    setStrategyConfig(prev => ({
      ...prev,
      exit_conditions: [
        ...prev.exit_conditions,
        {
          indicator: "close",
          comparison: "below",
          value: "sma_20"
        }
      ]
    }));
  };

  // Add indicator
  const handleAddIndicator = () => {
    setStrategyConfig(prev => ({
      ...prev,
      indicators: [
        ...prev.indicators,
        {
          name: "SMA",
          params: {
            period: 50
          }
        }
      ]
    }));
  };

  // Update entry condition
  const handleUpdateEntryCondition = (index, field, value) => {
    setStrategyConfig(prev => {
      const updatedConditions = [...prev.entry_conditions];
      updatedConditions[index] = {
        ...updatedConditions[index],
        [field]: value
      };
      return {
        ...prev,
        entry_conditions: updatedConditions
      };
    });
  };

  // Update exit condition
  const handleUpdateExitCondition = (index, field, value) => {
    setStrategyConfig(prev => {
      const updatedConditions = [...prev.exit_conditions];
      updatedConditions[index] = {
        ...updatedConditions[index],
        [field]: value
      };
      return {
        ...prev,
        exit_conditions: updatedConditions
      };
    });
  };

  // Update indicator
  const handleUpdateIndicator = (index, field, value) => {
    setStrategyConfig(prev => {
      const updatedIndicators = [...prev.indicators];
      
      if (field === 'name') {
        updatedIndicators[index] = {
          name: value,
          params: updatedIndicators[index].params
        };
      } else if (field.startsWith('params.')) {
        const paramName = field.split('.')[1];
        updatedIndicators[index] = {
          ...updatedIndicators[index],
          params: {
            ...updatedIndicators[index].params,
            [paramName]: value
          }
        };
      }
      
      return {
        ...prev,
        indicators: updatedIndicators
      };
    });
  };

  // Delete entry condition
  const handleDeleteEntryCondition = (index) => {
    setStrategyConfig(prev => ({
      ...prev,
      entry_conditions: prev.entry_conditions.filter((_, i) => i !== index)
    }));
  };

  // Delete exit condition
  const handleDeleteExitCondition = (index) => {
    setStrategyConfig(prev => ({
      ...prev,
      exit_conditions: prev.exit_conditions.filter((_, i) => i !== index)
    }));
  };

  // Delete indicator
  const handleDeleteIndicator = (index) => {
    setStrategyConfig(prev => ({
      ...prev,
      indicators: prev.indicators.filter((_, i) => i !== index)
    }));
  };

  // Update risk management
  const handleUpdateRiskManagement = (field, value) => {
    setStrategyConfig(prev => ({
      ...prev,
      risk_management: {
        ...prev.risk_management,
        [field]: value
      }
    }));
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, height: '100vh', overflow: 'auto' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ color: theme.palette.primary.main }}>
              Trading Strategy Builder
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveStrategy}
              >
                Save Strategy
              </Button>
              <Button 
                variant="contained" 
                color="accent"
                startIcon={<RunIcon />}
              >
                Backtest
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Strategy Selection */}
            <Grid item xs={12} md={4}>
              <Card title="Strategy Library">
                <TextField
                  fullWidth
                  label="Strategy Name"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Saved Strategies
                </Typography>
                <Box sx={{ height: '200px', overflowY: 'auto' }}>
                  {savedStrategies.map((strategy) => (
                    <Box 
                      key={strategy.id}
                      sx={{
                        p: 1,
                        my: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                      onClick={() => handleLoadStrategy(strategy.id)}
                    >
                      <Typography variant="subtitle2">{strategy.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {strategy.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={handleOpenEditor}
                >
                  Edit YAML Directly
                </Button>
              </Card>
            </Grid>

            {/* Strategy Configuration */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 0, borderRadius: 2 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    bgcolor: theme.palette.primary.main,
                    borderRadius: '8px 8px 0 0',
                    '& .MuiTab-root': { color: theme.palette.secondary.main },
                    '& .Mui-selected': { color: theme.palette.accent.main }
                  }}
                  TabIndicatorProps={{
                    style: { backgroundColor: theme.palette.accent.main }
                  }}
                >
                  <Tab label="General" />
                  <Tab label="Entry Conditions" />
                  <Tab label="Exit Conditions" />
                  <Tab label="Indicators" />
                  <Tab label="Risk Management" />
                </Tabs>
                <Box sx={{ p: 3 }}>
                  {/* General Settings Tab */}
                  {activeTab === 0 && (
                    <SymbolsAndTimeframe 
                      strategyConfig={strategyConfig}
                      onUpdateSymbols={handleUpdateSymbols}
                      onUpdateTimeframe={(value) => setStrategyConfig(prev => ({ ...prev, timeframe: value }))}
                      onUpdateStartDate={(value) => setStrategyConfig(prev => ({ ...prev, start_date: value }))}
                      onUpdateEndDate={(value) => setStrategyConfig(prev => ({ ...prev, end_date: value }))}
                    />
                  )}

                  {/* Entry Conditions Tab */}
                  {activeTab === 1 && (
                    <ConditionsTab 
                      conditions={strategyConfig.entry_conditions}
                      indicators={strategyConfig.indicators}
                      onAddCondition={handleAddEntryCondition}
                      onUpdateCondition={handleUpdateEntryCondition}
                      onDeleteCondition={handleDeleteEntryCondition}
                    />
                  )}

                  {/* Exit Conditions Tab */}
                  {activeTab === 2 && (
                    <ConditionsTab 
                      conditions={strategyConfig.exit_conditions}
                      indicators={strategyConfig.indicators}
                      onAddCondition={handleAddExitCondition}
                      onUpdateCondition={handleUpdateExitCondition}
                      onDeleteCondition={handleDeleteExitCondition}
                    />
                  )}

                  {/* Indicators Tab */}
                  {activeTab === 3 && (
                    <IndicatorsTab 
                      indicators={strategyConfig.indicators}
                      onAddIndicator={handleAddIndicator}
                      onUpdateIndicator={handleUpdateIndicator}
                      onDeleteIndicator={handleDeleteIndicator}
                    />
                  )}

                  {/* Risk Management Tab */}
                  {activeTab === 4 && (
                    <RiskManagementTab 
                      riskManagement={strategyConfig.risk_management}
                      onUpdateRiskManagement={handleUpdateRiskManagement}
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* YAML Editor Modal */}
          <Modal
            open={isEditorOpen}
            onClose={handleCloseEditor}
            title="YAML Configuration"
            actions={
              <>
                <Button onClick={handleCloseEditor} color="primary" variant="outlined">
                  Cancel
                </Button>
                <Button onClick={handleApplyYaml} color="accent" variant="contained">
                  Apply
                </Button>
              </>
            }
            maxWidth="md"
          >
            <TextField
              fullWidth
              multiline
              rows={20}
              value={yamlConfig}
              onChange={(e) => setYamlConfig(e.target.value)}
              variant="outlined"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'monospace',
                }
              }}
            />
          </Modal>

          {/* Success Notification */}
          <Snackbar open={saveSuccess} autoHideDuration={3000} onClose={() => setSaveSuccess(false)}>
            <Alert onClose={() => setSaveSuccess(false)} severity="success" sx={{ width: '100%' }}>
              Strategy saved successfully!
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
};

// Symbols and Timeframe Component
const SymbolsAndTimeframe = ({ 
  strategyConfig, 
  onUpdateSymbols, 
  onUpdateTimeframe,
  onUpdateStartDate,
  onUpdateEndDate
}) => {
  const theme = useTheme();
  const [newSymbol, setNewSymbol] = useState('');

  const timeframeOptions = [
    { value: '1Min', label: '1 Minute' },
    { value: '5Min', label: '5 Minutes' },
    { value: '15Min', label: '15 Minutes' },
    { value: '30Min', label: '30 Minutes' },
    { value: '1H', label: '1 Hour' },
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' }
  ];

  const addSymbol = () => {
    if (newSymbol && !strategyConfig.symbols.includes(newSymbol)) {
      onUpdateSymbols([...strategyConfig.symbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  const removeSymbol = (symbol) => {
    onUpdateSymbols(strategyConfig.symbols.filter(s => s !== symbol));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSymbol();
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>General Settings</Typography>
      
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Symbols</Typography>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {strategyConfig.symbols.map((symbol) => (
            <Chip
              key={symbol}
              label={symbol}
              onDelete={() => removeSymbol(symbol)}
              sx={{ 
                bgcolor: theme.palette.accent.main,
                color: theme.palette.primary.main,
                fontWeight: 500
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            label="Add Symbol"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            sx={{ flexGrow: 1 }}
          />
          <Button onClick={addSymbol} color="primary" variant="contained">
            Add
          </Button>
        </Box>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Timeframe</Typography>
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel>Select Timeframe</InputLabel>
        <Select
          value={strategyConfig.timeframe}
          onChange={(e) => onUpdateTimeframe(e.target.value)}
          label="Select Timeframe"
        >
          {timeframeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Date Range</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={strategyConfig.start_date}
            onChange={(e) => onUpdateStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={strategyConfig.end_date}
            onChange={(e) => onUpdateEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Conditions Tab Component
const ConditionsTab = ({ 
  conditions, 
  indicators, 
  onAddCondition, 
  onUpdateCondition, 
  onDeleteCondition 
}) => {
  const theme = useTheme();

  // Generate indicator options
  const indicatorOptions = React.useMemo(() => {
    const options = ['open', 'high', 'low', 'close', 'volume'];
    
    indicators.forEach(indicator => {
      if (indicator.name === 'SMA' || indicator.name === 'EMA') {
        options.push(`${indicator.name.toLowerCase()}_${indicator.params.period}`);
      } else if (indicator.name === 'RSI') {
        options.push('rsi');
      } else if (indicator.name === 'BBANDS') {
        options.push('upperband', 'middleband', 'lowerband');
      }
    });
    
    return options;
  }, [indicators]);

  // Comparison options
  const comparisonOptions = [
    { value: 'above', label: 'Above' },
    { value: 'below', label: 'Below' },
    { value: 'crosses_above', label: 'Crosses Above' },
    { value: 'crosses_below', label: 'Crosses Below' },
    { value: 'between', label: 'Between' }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {conditions === onAddCondition ? 'Entry Conditions' : 'Exit Conditions'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={onAddCondition}
        >
          Add Condition
        </Button>
      </Box>

      {conditions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No conditions defined. Click "Add Condition" to create one.
        </Typography>
      ) : (
        conditions.map((condition, index) => (
          <Paper 
            key={index} 
            elevation={1} 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Condition {index + 1}
              </Typography>
              <IconButton 
                size="small"
                onClick={() => onDeleteCondition(index)}
                sx={{ color: theme.palette.error.main }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Indicator</InputLabel>
                  <Select
                    value={condition.indicator}
                    onChange={(e) => onUpdateCondition(index, 'indicator', e.target.value)}
                    label="Indicator"
                  >
                    {indicatorOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Comparison</InputLabel>
                  <Select
                    value={condition.comparison}
                    onChange={(e) => onUpdateCondition(index, 'comparison', e.target.value)}
                    label="Comparison"
                  >
                    {comparisonOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                {/* If condition.value is a string and it's in indicatorOptions, show a select */}
                {typeof condition.value === 'string' && indicatorOptions.includes(condition.value) ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Value</InputLabel>
                    <Select
                      value={condition.value}
                      onChange={(e) => onUpdateCondition(index, 'value', e.target.value)}
                      label="Value"
                    >
                      {indicatorOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                      <MenuItem value="_custom">Enter Custom Value</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={condition.value}
                    onChange={(e) => onUpdateCondition(index, 'value', e.target.value)}
                  />
                )}
              </Grid>
            </Grid>
          </Paper>
        ))
      )}
    </Box>
  );
};

// Indicators Tab Component
const IndicatorsTab = ({ 
  indicators, 
  onAddIndicator, 
  onUpdateIndicator, 
  onDeleteIndicator 
}) => {
  const theme = useTheme();

  // Available indicators
  const availableIndicators = [
    { value: 'SMA', label: 'Simple Moving Average' },
    { value: 'EMA', label: 'Exponential Moving Average' },
    { value: 'RSI', label: 'Relative Strength Index' },
    { value: 'BBANDS', label: 'Bollinger Bands' },
    { value: 'MACD', label: 'Moving Average Convergence Divergence' },
    { value: 'ATR', label: 'Average True Range' }
  ];

  // Get parameter fields based on indicator type
  const getIndicatorParams = (indicator) => {
    switch (indicator.name) {
      case 'SMA':
      case 'EMA':
      case 'RSI':
      case 'ATR':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Period"
                type="number"
                value={indicator.params.period}
                onChange={(e) => onUpdateIndicator(
                  indicators.indexOf(indicator), 
                  'params.period', 
                  parseInt(e.target.value)
                )}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>
        );
      case 'BBANDS':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Period"
                type="number"
                value={indicator.params.period || 20}
                onChange={(e) => onUpdateIndicator(
                  indicators.indexOf(indicator), 
                  'params.period', 
                  parseInt(e.target.value)
                )}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Standard Deviation"
                type="number"
                value={indicator.params.std_dev || 2}
                onChange={(e) => onUpdateIndicator(
                  indicators.indexOf(indicator), 
                  'params.std_dev', 
                  parseFloat(e.target.value)
                )}
                InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
              />
            </Grid>
          </Grid>
        );
      case 'MACD':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Fast Period"
                type="number"
                value={indicator.params.fast_period || 12}
                onChange={(e) => onUpdateIndicator(
                  indicators.indexOf(indicator), 
                  'params.fast_period', 
                  parseInt(e.target.value)
                )}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Slow Period"
                type="number"
                value={indicator.params.slow_period || 26}
                onChange={(e) => onUpdateIndicator(
                  indicators.indexOf(indicator), 
                  'params.slow_period', 
                  parseInt(e.target.value)
                )}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Signal Period"
                type="number"
                value={indicator.params.signal_period || 9}
                onChange={(e) => onUpdateIndicator(
                  indicators.indexOf(indicator), 
                  'params.signal_period', 
                  parseInt(e.target.value)
                )}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Technical Indicators</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={onAddIndicator}
        >
          Add Indicator
        </Button>
      </Box>

      {indicators.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No indicators defined. Click "Add Indicator" to create one.
        </Typography>
      ) : (
        indicators.map((indicator, index) => (
          <Paper 
            key={index} 
            elevation={1} 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {availableIndicators.find(i => i.value === indicator.name)?.label || indicator.name}
              </Typography>
              <IconButton 
                size="small"
                onClick={() => onDeleteIndicator(index)}
                sx={{ color: theme.palette.error.main }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Indicator Type</InputLabel>
              <Select
                value={indicator.name}
                onChange={(e) => onUpdateIndicator(index, 'name', e.target.value)}
                label="Indicator Type"
              >
                {availableIndicators.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {getIndicatorParams(indicator)}
          </Paper>
        ))
      )}
    </Box>
  );
};

// Risk Management Tab Component
const RiskManagementTab = ({ riskManagement, onUpdateRiskManagement }) => {
  const theme = useTheme();

  // Position sizing methods
  const positionSizingMethods = [
    { value: 'risk_based', label: 'Risk Based' },
    { value: 'atr_based', label: 'ATR Based' },
    { value: 'fixed', label: 'Fixed Size' },
    { value: 'percentage', label: 'Percentage of Capital' }
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Risk Management Settings</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <InputLabel>Position Sizing Method</InputLabel>
            <Select
              value={riskManagement.position_sizing_method}
              onChange={(e) => onUpdateRiskManagement('position_sizing_method', e.target.value)}
              label="Position Sizing Method"
            >
              {positionSizingMethods.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Risk Per Trade (%)"
            type="number"
            value={riskManagement.risk_per_trade * 100}
            onChange={(e) => onUpdateRiskManagement('risk_per_trade', parseFloat(e.target.value) / 100)}
            InputProps={{ 
              inputProps: { min: 0.01, max: 100, step: 0.1 },
              endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>%</Typography>
            }}
            sx={{ mb: 3 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Stop Loss (%)"
            type="number"
            value={riskManagement.stop_loss * 100}
            onChange={(e) => onUpdateRiskManagement('stop_loss', parseFloat(e.target.value) / 100)}
            InputProps={{ 
              inputProps: { min: 0.01, max: 100, step: 0.1 },
              endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>%</Typography>
            }}
            sx={{ mb: 3 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Take Profit (%)"
            type="number"
            value={riskManagement.take_profit * 100}
            onChange={(e) => onUpdateRiskManagement('take_profit', parseFloat(e.target.value) / 100)}
            InputProps={{ 
              inputProps: { min: 0.01, max: 100, step: 0.1 },
              endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>%</Typography>
            }}
            sx={{ mb: 3 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Max Position Size"
            type="number"
            value={riskManagement.max_position_size}
            onChange={(e) => onUpdateRiskManagement('max_position_size', parseFloat(e.target.value))}
            InputProps={{ inputProps: { min: 1 } }}
            sx={{ mb: 3 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="ATR Multiplier"
            type="number"
            value={riskManagement.atr_multiplier}
            onChange={(e) => onUpdateRiskManagement('atr_multiplier', parseFloat(e.target.value))}
            InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
            sx={{ mb: 3 }}
            disabled={riskManagement.position_sizing_method !== 'atr_based'}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ 
        p: 2, 
        borderRadius: 1, 
        bgcolor: theme.palette.info.light, 
        color: theme.palette.info.contrastText 
      }}>
        <Typography variant="subtitle2">About Risk Management</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Risk Based Sizing:</strong> Calculates position size based on account risk per trade and stop loss distance.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>ATR Based Sizing:</strong> Uses Average True Range to determine position size and stop loss levels.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Fixed Sizing:</strong> Uses a constant position size for all trades.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Percentage Sizing:</strong> Uses a percentage of available capital for each trade.
        </Typography>
      </Box>
    </Box>
  );
};

export default StrategyBuilderPage;