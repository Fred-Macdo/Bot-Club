import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Avatar,
  MenuItem,
  Fade,
  useTheme,
  IconButton,
  Stack, 
  Typography, 
  Select,
  Grid,
  Divider
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import axios from 'axios';

const ProfileSettings = () => {
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
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

  const states = [
    { "name": "Alabama", "abbreviation": "AL" },
    { "name": "Alaska", "abbreviation": "AK" },
    { "name": "American Samoa", "abbreviation": "AS" },
    { "name": "Arizona", "abbreviation": "AZ" },
    { "name": "Arkansas", "abbreviation": "AR" },
    { "name": "California", "abbreviation": "CA" },
    { "name": "Colorado", "abbreviation": "CO" },
    { "name": "Connecticut", "abbreviation": "CT" },
    { "name": "Delaware", "abbreviation": "DE" },
    { "name": "District Of Columbia", "abbreviation": "DC" },
    { "name": "Federated States Of Micronesia", "abbreviation": "FM" },
    { "name": "Florida", "abbreviation": "FL" },
    { "name": "Georgia", "abbreviation": "GA" },
    { "name": "Guam", "abbreviation": "GU" },
    { "name": "Hawaii", "abbreviation": "HI" },
    { "name": "Idaho", "abbreviation": "ID" },
    { "name": "Illinois", "abbreviation": "IL" },
    { "name": "Indiana", "abbreviation": "IN" },
    { "name": "Iowa", "abbreviation": "IA" },
    { "name": "Kansas", "abbreviation": "KS" },
    { "name": "Kentucky", "abbreviation": "KY" },
    { "name": "Louisiana", "abbreviation": "LA" },
    { "name": "Maine", "abbreviation": "ME" },
    { "name": "Marshall Islands", "abbreviation": "MH" },
    { "name": "Maryland", "abbreviation": "MD" },
    { "name": "Massachusetts", "abbreviation": "MA" },
    { "name": "Michigan", "abbreviation": "MI" },
    { "name": "Minnesota", "abbreviation": "MN" },
    { "name": "Mississippi", "abbreviation": "MS" },
    { "name": "Missouri", "abbreviation": "MO" },
    { "name": "Montana", "abbreviation": "MT" },
    { "name": "Nebraska", "abbreviation": "NE" },
    { "name": "Nevada", "abbreviation": "NV" },
    { "name": "New Hampshire", "abbreviation": "NH" },
    { "name": "New Jersey", "abbreviation": "NJ" },
    { "name": "New Mexico", "abbreviation": "NM" },
    { "name": "New York", "abbreviation": "NY" },
    { "name": "North Carolina", "abbreviation": "NC" },
    { "name": "North Dakota", "abbreviation": "ND" },
    { "name": "Northern Mariana Islands", "abbreviation": "MP" },
    { "name": "Ohio", "abbreviation": "OH" },
    { "name": "Oklahoma", "abbreviation": "OK" },
    { "name": "Oregon", "abbreviation": "OR" },
    { "name": "Palau", "abbreviation": "PW" },
    { "name": "Pennsylvania", "abbreviation": "PA" },
    { "name": "Puerto Rico", "abbreviation": "PR" },
    { "name": "Rhode Island", "abbreviation": "RI" },
    { "name": "South Carolina", "abbreviation": "SC" },
    { "name": "South Dakota", "abbreviation": "SD" },
    { "name": "Tennessee", "abbreviation": "TN" },
    { "name": "Texas", "abbreviation": "TX" },
    { "name": "Utah", "abbreviation": "UT" },
    { "name": "Vermont", "abbreviation": "VT" },
    { "name": "Virgin Islands", "abbreviation": "VI" },
    { "name": "Virginia", "abbreviation": "VA" },
    { "name": "Washington", "abbreviation": "WA" },
    { "name": "West Virginia", "abbreviation": "WV" },
    { "name": "Wisconsin", "abbreviation": "WI" },
    { "name": "Wyoming", "abbreviation": "WY" }
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
    <Box sx={{ py: 2 }}> 
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 1, color: theme.palette.text.primary, textAlign: 'center' }}>
        Profile Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Update your personal information and preferences used throughout your trading experience.
      </Typography>
      <Box 
        sx={{ 
          maxWidth: '600px',
          mx: 'auto',
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* Profile Image */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={formData.profileImage}
                  sx={{
                    width: 120,
                    height: 120,
                    border: `3px solid ${theme.palette.primary.main}`
                  }}
                />
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
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

            <Divider sx={{ my: 2 }} />

            {/* Personal Information */}
            <TextField
              
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone || "Optional"}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              
              label="Address Line 1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              error={!!errors.addressLine1}
              helperText={errors.addressLine1}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              
              label="Address Line 2"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              error={!!errors.addressLine2}
              helperText={errors.addressLine2 || "Optional"}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={!!errors.city}
              helperText={errors.city}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              
              select
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              error={!!errors.state}
              helperText={errors.state}
              disabled={loading}
              variant="outlined"
            >
              {states.map((option) => (
                <MenuItem key={option.abbreviation} value={option.abbreviation}>
                  {option.name}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              
              label="ZIP Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              error={!!errors.zipCode}
              helperText={errors.zipCode}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              
              select
              label="Timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              disabled={loading}
              variant="outlined"
            >
              {timezones.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              multiline
              rows={4}
              disabled={loading}
              helperText="Tell us a little about yourself (optional)"
              variant="outlined"
            />

            {formStatus && (
              <Fade in={!!formStatus}>
                <Alert severity={formStatus.type} sx={{ mt: 2 }}>
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
              
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileSettings;