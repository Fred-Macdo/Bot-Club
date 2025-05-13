import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const ThemeToggle = ({ toggleColorMode }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Tooltip title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton 
        onClick={toggleColorMode}
        color="inherit"
        sx={{
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          },
          boxShadow: theme.shadows[2],
        }}
      >
        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;