import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Container,
  useMediaQuery,
  useTheme,
  Link as MuiLink
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/bot-logo.png';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Dashboard', path: '/dashboard' }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Navigation handler
  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: theme.palette.primary.main }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box 
              component="img" 
              src={logo} 
              alt="Bot Club"
              sx={{ 
                height: 40, 
                mr: 1,
                display: { xs: 'none', sm: 'block' } 
              }} 
            />
            <Typography
              variant="h6"
              onClick={() => handleNavigation('/')}
              sx={{
                color: theme.palette.secondary.main,
                textDecoration: 'none',
                fontWeight: 700,
                letterSpacing: 1,
                cursor: 'pointer'
              }}
            >
              BOT CLUB
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  sx={{ 
                    color: theme.palette.secondary.main,
                    mx: 1,
                    '&:hover': {
                      color: theme.palette.accent?.main || '#fff'
                    }
                  }}
                >
                  {item.name}
                </Button>
              ))}
              <Button
                variant="contained"
                onClick={() => handleNavigation('/login')}
                sx={{
                  ml: 2,
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.accent?.main || '#bfae6a'
                  }
                }}
              >
                Login
              </Button>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ color: theme.palette.secondary.main }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        PaperProps={{
          sx: { 
            width: 240,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.secondary.main
          }
        }}
      >
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ my: 2, fontWeight: 700 }}>
            BOT CLUB
          </Typography>
          <List>
            {navItems.map((item) => (
              <ListItem 
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                sx={{ 
                  textAlign: 'center',
                  color: theme.palette.secondary.main,
                  cursor: 'pointer'
                }}
              >
                <ListItemText primary={item.name} />
              </ListItem>
            ))}
            <ListItem 
              onClick={() => handleNavigation('/login')}
              sx={{ 
                textAlign: 'center',
                color: theme.palette.accent?.main || '#f50057',
                cursor: 'pointer'
              }}
            >
              <ListItemText primary="Login" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;