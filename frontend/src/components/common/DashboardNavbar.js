import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../router/AuthContext';

const DashboardNavbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      handleMenuClose();
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigate = (path) => {
    handleMenuClose();
    navigate(path);
  };

  // Mock notifications
  const notifications = [
    { id: 1, message: 'Strategy "EMA Crossover" executed a trade', time: '2 hours ago' },
    { id: 2, message: 'New market data available', time: '5 hours ago' },
    { id: 3, message: 'Account balance updated', time: 'Yesterday' }
  ];

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: 1,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            color: theme.palette.primary.main,
            fontWeight: 600
          }}
        >
          {/* Current page title - could be dynamic */}
          Trading Dashboard
        </Typography>

        {/* Notifications */}
        <IconButton 
          color="inherit"
          onClick={handleNotificationsMenuOpen}
          sx={{ mr: 2 }}
        >
          <Badge badgeContent={notifications.length} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="end"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar 
              alt={user?.user_metadata?.full_name || 'User'} 
              src="/static/images/avatar/1.jpg"
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.secondary.main
              }}
            >
              {(user?.user_metadata?.full_name || 'U')[0]}
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 180,
              boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.1)'
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleNavigate('/account')}>
            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
            My Account
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/account/settings')}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleNotificationsClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 280,
              maxWidth: 320,
              boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.1)'
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 600 }}>
            Notifications
          </Typography>
          <Divider />
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <MenuItem key={notification.id} onClick={handleNotificationsClose}>
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2">{notification.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <MenuItem>
              <Typography variant="body2">No new notifications</Typography>
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleNotificationsClose} sx={{ justifyContent: 'center' }}>
            <Typography variant="body2" color="primary">
              View All Notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardNavbar; 