import React from 'react';
import { Button as MuiButton, useTheme } from '@mui/material';

// Custom button component with Bot Club styling
const Button = ({ 
  variant = 'contained', 
  color = 'primary', 
  size = 'medium', 
  children, 
  ...props 
}) => {
  const theme = useTheme();

  // Define custom styling based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'contained':
        return {
          bgcolor: 
            color === 'primary' ? theme.palette.primary.main : 
            color === 'secondary' ? theme.palette.secondary.main : 
            color === 'accent' ? theme.palette.accent.main : 
            undefined,
          color: 
            color === 'primary' ? theme.palette.secondary.main : 
            color === 'secondary' ? theme.palette.primary.main : 
            color === 'accent' ? theme.palette.primary.main : 
            undefined,
          '&:hover': {
            bgcolor: 
              color === 'primary' ? theme.palette.primary.dark : 
              color === 'secondary' ? theme.palette.secondary.dark : 
              color === 'accent' ? theme.palette.accent.dark : 
              undefined,
          }
        };
      case 'outlined':
        return {
          bgcolor: 'transparent',
          borderColor: 
            color === 'primary' ? theme.palette.primary.main : 
            color === 'secondary' ? theme.palette.secondary.main : 
            color === 'accent' ? theme.palette.accent.main : 
            undefined,
          color: 
            color === 'primary' ? theme.palette.primary.main : 
            color === 'secondary' ? theme.palette.secondary.main : 
            color === 'accent' ? theme.palette.accent.main : 
            undefined,
          '&:hover': {
            bgcolor: 
              color === 'primary' ? 'rgba(13, 55, 42, 0.05)' : 
              color === 'secondary' ? 'rgba(245, 237, 216, 0.05)' : 
              color === 'accent' ? 'rgba(212, 200, 146, 0.05)' : 
              undefined,
          }
        };
      default:
        return {};
    }
  };

  return (
    <MuiButton
      variant={variant}
      size={size}
      sx={{
        fontWeight: 600,
        borderRadius: '4px',
        textTransform: 'none',
        transition: 'all 0.3s ease',
        ...getButtonStyles(),
        ...props.sx
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;