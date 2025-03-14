import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const [socialLoginInProgress, setSocialLoginInProgress] = useState<string | null>(null);

  // This is a mock function for social login
  // In a real implementation, this would integrate with AWS Cognito and the social providers
  const handleSocialLogin = async (provider: string) => {
    setSocialLoginInProgress(provider);
    dispatch(loginStart());
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      dispatch(loginSuccess({
        id: '123456',
        username: `User_${provider}`,
        email: `user@${provider.toLowerCase()}.com`,
        profilePicture: `/avatars/${provider.toLowerCase()}.png`,
        rating: 1200,
        gamesPlayed: 10,
        gamesWon: 5,
        gamesLost: 3,
        gamesTied: 2
      }));
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      dispatch(loginFailure('Authentication failed. Please try again.'));
    } finally {
      setSocialLoginInProgress(null);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Sign In
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to save your games, track your progress, and play with friends
        </Typography>
        
        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => handleSocialLogin('Google')}
            disabled={isLoading || socialLoginInProgress !== null}
            sx={{ 
              bgcolor: '#4285F4', 
              '&:hover': { bgcolor: '#3367D6' },
              py: 1.5
            }}
          >
            {socialLoginInProgress === 'Google' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Continue with Google'
            )}
          </Button>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<FacebookIcon />}
            onClick={() => handleSocialLogin('Facebook')}
            disabled={isLoading || socialLoginInProgress !== null}
            sx={{ 
              bgcolor: '#3b5998', 
              '&:hover': { bgcolor: '#2d4373' },
              py: 1.5
            }}
          >
            {socialLoginInProgress === 'Facebook' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Continue with Facebook'
            )}
          </Button>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => handleSocialLogin('TikTok')}
            disabled={isLoading || socialLoginInProgress !== null}
            sx={{ 
              bgcolor: '#000000', 
              '&:hover': { bgcolor: '#333333' },
              py: 1.5
            }}
          >
            {socialLoginInProgress === 'TikTok' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Continue with TikTok'
            )}
          </Button>
        </Box>
        
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>
        
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => handleSocialLogin('Guest')}
            disabled={isLoading || socialLoginInProgress !== null}
          >
            {socialLoginInProgress === 'Guest' ? (
              <CircularProgress size={24} />
            ) : (
              'Continue as Guest'
            )}
          </Button>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Guest accounts can play games but progress won't be saved
          </Typography>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;