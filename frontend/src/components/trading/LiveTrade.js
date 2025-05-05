// src/components/trading/LiveTradingPage.js
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const LiveTradingPage = () => {
  const theme = useTheme();
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
        Live Trading
      </Typography>
      {/* Live trading content would go here */}
      <Typography variant="body1">
        Live trading page content coming soon...
      </Typography>
    </Box>
  );
};

export default LiveTradingPage;