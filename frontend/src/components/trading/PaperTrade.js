// src/components/trading/PaperTradingPage.js
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const PaperTradingPage = () => {
  const theme = useTheme();
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
        Paper Trading
      </Typography>
      {/* Paper trading content would go here */}
      <Typography variant="body1">
        Paper trading page content coming soon...
      </Typography>
    </Box>
  );
};

export default PaperTradingPage;