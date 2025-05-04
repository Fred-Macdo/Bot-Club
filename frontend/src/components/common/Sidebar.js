import React from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Divider,
  useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Science as ScienceIcon,
  ShowChart as ShowChartIcon,
  Key as KeyIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/images/bot-logo.png';

const drawerWidth = 240;

const Sidebar = ({ onLogout }) => {
  const theme = useTheme();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Configurations', icon: <SettingsIcon />, path: '/config' },
    { label: 'Backtest', icon: <ScienceIcon />, path: '/backtest' },
    { label: 'Trading', icon: <ShowChartIcon />, path: '/trading' },
    { label: 'API Keys', icon: <KeyIcon />, path: '/keys' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: theme.palette.primary.main,
          color: theme.palette.secondary.main,
        },
      }}
      variant="permanent"
      anchor="left"
    >
      {/* Logo and Title */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box component="img" src={logo} alt="Bot Club" sx={{ height: 50, mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          BOT CLUB
        </Typography>
      </Box>
      
      <Divider sx={{ bgcolor: 'rgba(245, 237, 216, 0.2)' }} />
      
      {/* Menu Items */}
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.label} 
            component={Link} 
            to={item.path}
            sx={{ 
              color: isActive(item.path) ? theme.palette.accent.main : theme.palette.secondary.main,
              bgcolor: isActive(item.path) ? 'rgba(212, 200, 146, 0.1)' : 'transparent',
              borderRight: isActive(item.path) ? `3px solid ${theme.palette.accent.main}` : 'none',
              '&:hover': {
                bgcolor: 'rgba(212, 200, 146, 0.05)',
                color: theme.palette.accent.main
              },
              mb: 1,
              borderRadius: '4px 0 0 4px'
            }}
          >
            <ListItemIcon sx={{ 
              color: isActive(item.path) ? theme.palette.accent.main : theme.palette.secondary.main,
              minWidth: 40
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* Logout Button */}
      <List sx={{ pb: 2 }}>
        <Divider sx={{ bgcolor: 'rgba(245, 237, 216, 0.2)', mb: 1 }} />
        <ListItem 
          button 
          onClick={onLogout}
          sx={{
            color: theme.palette.secondary.main,
            '&:hover': {
              bgcolor: 'rgba(212, 200, 146, 0.05)',
              color: theme.palette.accent.main
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;