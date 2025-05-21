// /frontend/src/components/auth/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../router/AuthContext';
import { supabase } from '../../lib/supabase'; // Added import for supabase client
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
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Profile information
    firstName: '',
    lastName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
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

  // States options
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
      // Step 1: Sign up with Supabase
      const fullName = `${userData.firstName} ${userData.lastName}`.trim(); // Construct full_name

      const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { 
            username: userData.userName, // Pass username
            full_name: fullName         // Pass full_name
            // avatar_url will not be passed here as it's removed from Supabase profiles
          }
        }
      });

      if (supabaseError) {
        setFormError(`Registration failed: ${supabaseError.message}`);
        setLoading(false);
        return;
      }

      if (!supabaseData.user) {
        // This case should ideally be covered by supabaseError, but as a safeguard:
        setFormError('Registration did not return a user. Please try again.');
        setLoading(false);
        return;
      }

      const supabaseId = supabaseData.user.id;

      // Step 2: Prepare data for your backend, including the supabaseId
      const profileData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phone || null, // Matches UserProfile.phoneNumber
        bio: userData.bio || null,          // Matches UserProfile.bio
        avatarBase64: userData.profileImage || null, // Send base64 image string
        address: null,
      };

      if (userData.addressLine1) {
        profileData.address = {
          street: userData.addressLine1,        // Matches Address.street
          // If userData.addressLine2 exists, you might append it to street:
          street: userData.addressLine2 ? `${userData.addressLine1}, ${userData.addressLine2}` : userData.addressLine1,
          city: userData.city || null,          // Matches Address.city
          state: userData.state || null,        // Matches Address.state
          postalCode: userData.zipCode || null, // Matches Address.postalCode
          // country: userData.country || null, // Add if you have a country field in form
        };
      }

      const userDataToSave = {
        userName: userData.userName,
        email: userData.email,
        password: userData.password, // Backend expects password for its own hashing
        supabaseId: supabaseId,      // Pass the Supabase User ID
        profile: profileData,
      };
      
      // Call your backend signUp function (from AuthContext)
      const { error: backendError } = await signUp(userDataToSave);
      
      if (backendError) {
        // Handle case where Supabase user was created, but backend registration failed
        // For now, just show an error. More advanced handling could involve trying to clean up the Supabase user.
        setFormError(`Profile creation failed: ${backendError.message}. Your account was created with our authentication provider, but profile setup failed. Please contact support.`);
        // Potentially log supabaseId here for manual cleanup if needed
        console.error('Backend registration failed after Supabase success. Supabase User ID:', supabaseId);
        setLoading(false);
        return;
      }
      
      // Both Supabase and backend registration successful
      if (supabaseData.user && !supabaseData.session && supabaseData.user.identities && supabaseData.user.identities.length > 0) {
        // User created in Supabase, but email confirmation might be pending
        alert('Registration successful! Please check your email to confirm your account before logging in.');
        navigate('/login'); // Or to a page that says "check your email"
      } else if (supabaseData.session) {
        // User is created and session is active (e.g., auto-confirm enabled in Supabase)
        alert('Registration successful! You are now logged in.');
        navigate('/dashboard'); // Or wherever logged-in users should go
      } else {
        // Fallback, should ideally be covered by above conditions
        alert('Registration successful! You can now try to log in.');
        navigate('/login');
      }

    } catch (error) {
      // Catch-all for unexpected errors during the process
      console.error('Unexpected registration error:', error);
      setFormError('An unexpected error occurred during registration. Please try again.');
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
          
          <Typography sx={{ color: '#d4c892', mb: 1 }}>Username *</Typography>
          <TextField
            fullWidth
            id="userName"
            name="userName"
            value={userData.userName}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.userName}
            helperText={errors.userName}
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
            sx={{ mb: 2 }}
          />
          
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

          {/* Address Fields Start */}
          <Typography sx={{ color: '#d4c892', mb: 1, mt: 3 }}>Address Line 1</Typography>
          <TextField
            fullWidth
            id="addressLine1"
            name="addressLine1"
            value={userData.addressLine1}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.addressLine1}
            helperText={errors.addressLine1}
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
            sx={{ mb: 2 }}
          />

          <Typography sx={{ color: '#d4c892', mb: 1, mt: 1 }}>Address Line 2</Typography>
          <TextField
            fullWidth
            id="addressLine2"
            name="addressLine2"
            value={userData.addressLine2}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.addressLine2}
            helperText={errors.addressLine2 || "Optional"}
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
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ color: '#d4c892', mb: 1, mt: 1 }}>City</Typography>
              <TextField
                fullWidth
                id="city"
                name="city"
                value={userData.city}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.city}
                helperText={errors.city}
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
              <Typography sx={{ color: '#d4c892', mb: 1, mt: 1 }}>State</Typography>
              <TextField
                fullWidth
                select
                id="state"
                name="state"
                value={userData.state}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.state}
                helperText={errors.state}
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
              >
                {states.map((option) => (
                  <MenuItem key={option.abbreviation} value={option.abbreviation}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          
          <Typography sx={{ color: '#d4c892', mb: 1, mt: 3 }}>ZIP Code</Typography>
          <TextField
            fullWidth
            id="zipCode"
            name="zipCode"
            value={userData.zipCode}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.zipCode}
            helperText={errors.zipCode}
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
          {/* Address Fields End */}
          
          <Typography sx={{ color: '#d4c892', mb: 1, mt: 3 }}>Phone Number</Typography>
          <TextField
            fullWidth
            id="phone"
            name="phone"
            value={userData.phone}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.phone}
            helperText={errors.phone}
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
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              bgcolor: '#d4c892',
              color: '#113c35',
              '&:hover': {
                bgcolor: '#bfae6a'
              }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#113c35' }} /> : 'Sign Up'}
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#d4c892' }}>
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;