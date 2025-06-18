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
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, ExpandMore as ExpandMoreIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../router/AuthContext';
import { authApi } from '../../api/Client';

const ProfileSettings = () => {
  const theme = useTheme();
  const { user, refreshUser } = useAuth(); // Use refreshUser instead of setUser

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    timezone: 'America/New_York',
    bio: '',
    profileImage: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formStatus, setFormStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

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
    { "name": "Arizona", "abbreviation": "AZ" },
    { "name": "Arkansas", "abbreviation": "AR" },
    { "name": "California", "abbreviation": "CA" },
    { "name": "Colorado", "abbreviation": "CO" },
    { "name": "Connecticut", "abbreviation": "CT" },
    { "name": "Delaware", "abbreviation": "DE" },
    { "name": "Florida", "abbreviation": "FL" },
    { "name": "Georgia", "abbreviation": "GA" },
    { "name": "Hawaii", "abbreviation": "HI" },
    { "name": "Idaho", "abbreviation": "ID" },
    { "name": "Illinois", "abbreviation": "IL" },
    { "name": "Indiana", "abbreviation": "IN" },
    { "name": "Iowa", "abbreviation": "IA" },
    { "name": "Kansas", "abbreviation": "KS" },
    { "name": "Kentucky", "abbreviation": "KY" },
    { "name": "Louisiana", "abbreviation": "LA" },
    { "name": "Maine", "abbreviation": "ME" },
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
    { "name": "Ohio", "abbreviation": "OH" },
    { "name": "Oklahoma", "abbreviation": "OK" },
    { "name": "Oregon", "abbreviation": "OR" },
    { "name": "Pennsylvania", "abbreviation": "PA" },
    { "name": "Rhode Island", "abbreviation": "RI" },
    { "name": "South Carolina", "abbreviation": "SC" },
    { "name": "South Dakota", "abbreviation": "SD" },
    { "name": "Tennessee", "abbreviation": "TN" },
    { "name": "Texas", "abbreviation": "TX" },
    { "name": "Utah", "abbreviation": "UT" },
    { "name": "Vermont", "abbreviation": "VT" },
    { "name": "Virginia", "abbreviation": "VA" },
    { "name": "Washington", "abbreviation": "WA" },
    { "name": "West Virginia", "abbreviation": "WV" },
    { "name": "Wisconsin", "abbreviation": "WI" },
    { "name": "Wyoming", "abbreviation": "WY" }
  ];
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) { // If no user, don't attempt to fetch
        setFetchLoading(false);
        return;
      }

      setFetchLoading(true);
      setFormStatus(null);
      
      try {
        // Use the AuthAPI to get user profile
        const response = await authApi.getUserProfile(); // This is the call to client.js
        
        // The backend returns { user: { ... } } for /api/users/me
        // but if authApi.getUserProfile() directly returns the user object, adjust accordingly.
        // Assuming response is the user object directly or response.user is the user object.
        const profileData = response.user || response; 
        
        console.log('Profile data received for form:', profileData); 
        
        setFormData({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
          userName: profileData.userName || '',
          phone: profileData.phone || '',
          // Ensure address is handled correctly, it might be nested
          addressLine1: profileData.addressLine1 || profileData.address?.addressLine1 || '',
          addressLine2: profileData.addressLine2 || profileData.address?.addressLine2 || '',
          city: profileData.city || profileData.address?.city || '',
          state: profileData.state || profileData.address?.state || '',
          zipCode: profileData.zipCode || profileData.address?.zipCode || '',
          timezone: profileData.timezone || 'America/New_York',
          bio: profileData.bio || '',
          profileImage: profileData.profileImage || ''
        });
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        setFormStatus({
          type: 'error',
          message: error.message || 'Could not load profile information.',
        });
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProfileData();
  }, [user]); // Dependency array ensures this runs when user object is available/changes

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
    if (e.target.files && e.target.files[0]) {
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
      // Prepare the update data to match backend expectations
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        address: {
          addressLine1: formData.addressLine1 || null,
          addressLine2: formData.addressLine2 || null,
          city: formData.city || null,
          state: formData.state || null,
          zipCode: formData.zipCode || null
        },
        timezone: formData.timezone,
        bio: formData.bio || null,
        profileImage: formData.profileImage || null
      };

      console.log('Sending update data:', updateData);

      // Update the profile
      const response = await authApi.updateUserProfile(updateData);
      console.log('Update response:', response);

      // Refresh user data in the context
      await refreshUser();

      setFormStatus({
        type: 'success',
        message: 'Profile updated successfully!'
      });

      // Close the accordion after successful update
      setIsAccordionOpen(false);

    } catch (error) {
      console.error('Error updating profile:', error);
      setFormStatus({
        type: 'error',
        message: error.response?.data?.detail || error.message || 'An error occurred while updating your profile.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = () => {
    const parts = [
      formData.addressLine1,
      formData.addressLine2,
      formData.city,
      formData.state,
      formData.zipCode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}> 
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 1, color: theme.palette.text.primary, textAlign: 'center' }}>
        Profile Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        View and update your personal information and preferences.
      </Typography>

      {/* Show error if profile failed to load */}
      {formStatus?.type === 'error' && !formData.email && (
        <Alert severity="error" sx={{ my: 2 }}>{formStatus.message}</Alert>
      )}

      {/* Static Profile Display Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 2 }}>
          <Avatar 
            src={formData.profileImage} 
            sx={{ width: 80, height: 80, border: `2px solid ${theme.palette.primary.main}` }}
          >
            {formData.firstName?.[0] || formData.userName?.[0] || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h6">{formData.firstName} {formData.lastName}</Typography>
            <Typography variant="body1" color="text.secondary">{formData.userName ? `@${formData.userName}` : ''}</Typography>
            <Typography variant="body2" color="text.secondary">{formData.email}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography><strong>Phone:</strong> {formData.phone || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography><strong>Timezone:</strong> {formData.timezone || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography><strong>Address:</strong> {formatAddress()}</Typography>
          </Grid>
          {formData.bio && (
            <Grid item xs={12}>
              <Typography><strong>Bio:</strong> {formData.bio}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Show success message outside accordion */}
      {formStatus?.type === 'success' && (
        <Alert severity="success" sx={{ mb: 2 }}>{formStatus.message}</Alert>
      )}

      {/* Accordion for Update Form */}
      <Accordion expanded={isAccordionOpen} onChange={() => setIsAccordionOpen(!isAccordionOpen)} sx={{ boxShadow: 3, borderRadius: 2, '&:before': { display: 'none' } }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="profile-update-content"
          id="profile-update-header"
          sx={{ flexDirection: 'row-reverse', '& .MuiAccordionSummary-content': { marginLeft: 1 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon />
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {isAccordionOpen ? 'Close Editor' : 'Edit Profile Details'}
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {/* Profile Image Upload */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={formData.profileImage}
                      sx={{
                        width: 120,
                        height: 120,
                        border: `3px solid ${theme.palette.primary.main}`
                      }}
                    >
                      {formData.firstName?.[0] || formData.userName?.[0] || 'U'}
                    </Avatar>
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

                {/* Form Fields */}
                <TextField
                  fullWidth
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
                  fullWidth
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
                  fullWidth
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
                  fullWidth
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
                  fullWidth
                  label="Address Line 1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  disabled={loading}
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
                  label="Address Line 2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  helperText="Optional"
                  disabled={loading}
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
                  select
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
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
                  fullWidth
                  label="ZIP Code"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={loading}
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
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
                  fullWidth
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

                {/* Show error messages inside the form */}
                {formStatus?.type === 'error' && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {formStatus.message}
                  </Alert>
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
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ProfileSettings;