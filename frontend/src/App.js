import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Navbar from './components/common/Navbar'; // Add this import
import CssBaseline from '@mui/material/CssBaseline';
import AppRouter from './components/router/AppRouter';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#07372a', // BotClub dark green
    },
    secondary: {
      main: '#d4c892', // BotClub gold
    },
    accent: {
      main: '#d4c892', // Optional, for accent
    },
    background: {
      default: '#f5edd8', // BotClub light background
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;