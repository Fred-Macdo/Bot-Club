// /frontend/src/components/auth/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../router/AuthContext';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Link,
  Grid,
  MenuItem,
  Avatar,
  IconButton,
  Divider
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  // User data state
  const [userData, setUserData] = useState({
    // Account credentials
    email: '',
    password: '',
    confirmPassword: '',
    
    // Profile information
    firstName: '',
    lastName: '',
    phone: '',
    timezone: 'America/New_York',
    bio: '',
    profileImage: null
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({});
  
  // Timezone options
  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        setUserData(prev => ({
          ...prev,
          profileImage: event.target.result
        }));
      };
      
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Account credentials validation
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    
    if (!userData.password) {
      newErrors.password = 'Password is required';
    } else if (userData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (userData.password !== userData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Personal information validation
    if (!userData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!userData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (userData.phone && !/^\+?[1-9]\d{9,14}$/.test(userData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setFormError('');
    setLoading(true);
    
    try {
      // Format user data for MongoDB
      const userDataToSave = {
        email: userData.email,
        password: userData.password,
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone || null,
          timezone: userData.timezone,
          bio: userData.bio || null,
          profileImage: userData.profileImage
        },
        createdAt: new Date()
      };
      
      // Call signUp with the complete user data
      const { error } = await signUp(userDataToSave);
      
      if (error) {
        setFormError(error.message);
      } else {
        // Registration successful, redirect to login
        navigate('/login');
      }
    } catch (error) {
      setFormError('An error occurred during registration. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5edd8', // Light cream background
        py: 4
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#113c35',
          color: '#d4c892',
          width: '100%'
        }}
      >
        <Typography component="h1" variant="h5" sx={{ color: '#d4c892', fontWeight: 700, mb: 3 }}>
          Create Your Account
        </Typography>
        
        {/* Profile Image */}
        <Box sx={{ position: 'relative', mb: 4 }}>
          <Avatar
            src={userData.profileImage}
            sx={{
              width: 100,
              height: 100,
              border: `2px solid #d4c892`
            }}
          />
          <IconButton
            aria-label="upload picture"
            component="label"
            sx={{
              position: 'absolute',
              right: -10,
              bottom: -10,
              bgcolor: '#d4c892',
              color: '#113c35',
              '&:hover': {
                bgcolor: '#bfae6a'
              }
            }}
          >
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleImageChange}
              disabled={loading}
            />
            <PhotoCameraIcon />
          </IconButton>
        </Box>
        
        {formError && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {formError}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {/* Account Credentials Section */}
          <Typography variant="h6" sx={{ color: '#d4c892', mb: 2 }}>
            Account Credentials
          </Typography>
          <Divider sx={{ bgcolor: 'rgba(212, 200, 146, 0.2)', mb: 2 }} />
          
          <Typography sx={{ color: '#d4c892', mb: 1 }}>Email Address *</Typography>
          <TextField
            required
            fullWidth
            id="email"
            name="email"
            autoComplete="email"
            autoFocus
            value={userData.email}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.email}
            helperText={errors.email}
            variant="outlined"
            InputProps={{
              sx: {
                backgroundColor: '#f5edd8',
                color: '#07372a',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
              }
            }}
            sx={{ mb: 3 }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ color: '#d4c892', mb: 1 }}>Password *</Typography>
              <TextField
                required
                fullWidth
                name="password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={userData.password}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.password}
                helperText={errors.password}
                variant="outlined"
                InputProps={{
                  sx: {
                    backgroundColor: '#f5edd8',
                    color: '#07372a',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography sx={{ color: '#d4c892', mb: 1 }}>Confirm Password *</Typography>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={userData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                variant="outlined"
                InputProps={{
                  sx: {
                    backgroundColor: '#f5edd8',
                    color: '#07372a',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                  }
                }}
              />
            </Grid>
          </Grid>
          
          {/* Personal Information Section */}
          <Typography variant="h6" sx={{ color: '#d4c892', mb: 2, mt: 4 }}>
            Personal Information
          </Typography>
          <Divider sx={{ bgcolor: 'rgba(212, 200, 146, 0.2)', mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ color: '#d4c892', mb: 1 }}>First Name *</Typography>
              <TextField
                required
                fullWidth
                id="firstName"
                name="firstName"
                value={userData.firstName}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.firstName}
                helperText={errors.firstName}
                variant="outlined"
                InputProps={{
                  sx: {
                    backgroundColor: '#f5edd8',
                    color: '#07372a',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography sx={{ color: '#d4c892', mb: 1 }}>Last Name *</Typography>
              <TextField
                required
                fullWidth
                id="lastName"
                name="lastName"
                value={userData.lastName}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.lastName}
                helperText={errors.lastName}
                variant="outlined"
                InputProps={{
                  sx: {
                    backgroundColor: '#f5edd8',
                    color: '#07372a',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                  }
                }}
              />
            </Grid>
          </Grid>
          
          <Typography sx={{ color: '#d4c892', mb: 1, mt: 3 }}>Phone Number</Typography>
          <TextField
            fullWidth
            id="phone"
            name="phone"
            value={userData.phone}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.phone}
            helperText={errors.phone || "Optional"}
            variant="outlined"
            InputProps={{
              sx: {
                backgroundColor: '#f5edd8',
                color: '#07372a',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
              }
            }}
            sx={{ mb: 3 }}
          />
          
          <Typography sx={{ color: '#d4c892', mb: 1 }}>Timezone</Typography>
          <TextField
            fullWidth
            select
            id="timezone"
            name="timezone"
            value={userData.timezone}
            onChange={handleChange}
            disabled={loading}
            variant="outlined"
            InputProps={{
              sx: {
                backgroundColor: '#f5edd8',
                color: '#07372a',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
              }
            }}
            sx={{ mb: 3 }}
          >
            {timezones.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          
          <Typography sx={{ color: '#d4c892', mb: 1 }}>Bio</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            id="bio"
            name="bio"
            value={userData.bio}
            onChange={handleChange}
            disabled={loading}
            variant="outlined"
            placeholder="Tell us a little about yourself..."
            InputProps={{
              sx: {
                backgroundColor: '#f5edd8',
                color: '#07372a',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
              }
            }}
            sx={{ mb: 4 }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              backgroundColor: '#d4c892',
              color: '#07372a',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#bfae6a' },
              textTransform: 'uppercase'
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'REGISTER'}
          </Button>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#d4c892' }}>
              {"Already have an account? Login"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;