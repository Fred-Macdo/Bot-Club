import React from 'react';
import { Paper, Box, Typography, useTheme } from '@mui/material';

const Card = ({ 
  title, 
  subtitle,
  icon, 
  children, 
  elevation = 2, 
  highlighted = false,
  ...props 
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={highlighted ? elevation + 2 : elevation}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        position: 'relative',
        overflow: highlighted ? 'visible' : 'hidden',
        border: highlighted ? `2px solid ${theme.palette.accent.main}` : 'none',
        transition: 'all 0.3s ease',
        transform: highlighted ? 'scale(1.02)' : 'none',
        '&:hover': {
          boxShadow: highlighted ? theme.shadows[elevation + 3] : theme.shadows[elevation + 1],
          transform: highlighted ? 'scale(1.04)' : 'scale(1.01)',
        },
        ...props.sx
      }}
    >
      {highlighted && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: theme.palette.accent.main,
            color: theme.palette.primary.main,
            px: 2,
            py: 0.5,
            borderRadius: 1,
            fontWeight: 600,
            fontSize: '0.75rem',
            zIndex: 1
          }}
        >
          Popular
        </Box>
      )}

      {(title || icon) && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && <Box sx={{ color: theme.palette.primary.main }}>{icon}</Box>}
          <Box>
            {title && (
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <Box>
        {children}
      </Box>
    </Paper>
  );
};

export default Card;