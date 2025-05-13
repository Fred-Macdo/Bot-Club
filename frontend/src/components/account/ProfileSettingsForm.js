import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  MenuItem,
  Fade,
  useTheme,
  IconButton,
  Stack, 
  Typography
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import axios from 'axios';

const ProfileSettings = () => {
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    timezone: 'America/New_York',
    bio: '',
    profileImage: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [formStatus, setFormStatus] = useState(null);
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
    setFormData(prev => ({
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
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    
    if (formData.phone && !/^\+?[1-9]\d{9,14}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleImageChange = (e) => {
    // Handle profile image upload
    // This would typically upload to a server and get back a URL
    if (e.target.files && e.target.files[0]) {
      // For demo purposes, we'll just use a local URL
      // In a real app, you'd upload to a server
      const reader = new FileReader();
      
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          profileImage: event.target.result
        }));
      };
      
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setFormStatus(null);
    
    try {
      const response = await axios.post('http://localhost:8000/api/users/profile', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 200) {
        setFormStatus({
          type: 'success',
          message: 'Profile updated successfully!'
        });
      }
    } catch (error) {
      setFormStatus({
        type: 'error',
        message: error.response?.data?.message || 'An error occurred while updating your profile.'
      });
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: 600, margin: 'auto', mt: 4, color: theme.palette.primary.main }}>
      <Typography variant="h6" gutterBottom color={theme.palette.primary.main} sx={{ p: 2 }}>
        Profile Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Update your personal information and preferences used throughout your trading experience.
      </Typography>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Profile Image */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={formData.profileImage}
                  sx={{
                    width: 100,
                    height: 100,
                    border: `2px solid ${theme.palette.primary.main}`
                  }}
                />
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{
                    position: 'absolute',
                    right: -10,
                    bottom: -10,
                    bgcolor: theme.palette.background.paper,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
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
            </Box>

            <Divider />

            {/* Personal Information */}
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone || "Optional"}
              disabled={loading}
            />

            <TextField
              fullWidth
              select
              label="Timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              disabled={loading}
            >
              {timezones.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              multiline
              rows={4}
              disabled={loading}
              helperText="Tell us a little about yourself (optional)"
            />

            {formStatus && (
              <Fade in={!!formStatus}>
                <Alert severity={formStatus.type}>
                  {formStatus.message}
                </Alert>
              </Fade>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
              fullWidth
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings; 