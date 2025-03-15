import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Switch,
  Alert,
  Collapse,
  IconButton,
  Button,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { setUseGeminiAPI, isUsingGeminiAPI } from '../../services/ai/aiService';

// Local storage key
const USE_GEMINI_STORAGE_KEY = 'chess-online-use-gemini';

const GeminiConfig: React.FC = () => {
  const [useGemini, setUseGemini] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Log component mount
  useEffect(() => {
    console.log('GeminiConfig component mounted');
  }, []);

  // Load saved settings on component mount
  useEffect(() => {
    const savedUseGemini = localStorage.getItem(USE_GEMINI_STORAGE_KEY) === 'true';
    
    console.log('Loading saved Gemini settings from localStorage:');
    console.log('USE_GEMINI_STORAGE_KEY:', USE_GEMINI_STORAGE_KEY);
    console.log('savedUseGemini:', savedUseGemini);
    
    setUseGemini(savedUseGemini);
    
    // Initialize Gemini if it was previously enabled
    if (savedUseGemini) {
      console.log('Gemini was previously enabled, initializing...');
      try {
        setUseGeminiAPI(true);
      } catch (error) {
        console.error('Failed to initialize Gemini service:', error);
        setUseGemini(false);
        setUseGeminiAPI(false);
      }
    } else {
      console.log('Gemini was previously disabled, not initializing');
    }
  }, []);

  // Handle toggle change
  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setUseGemini(newValue);
    
    console.log(`Gemini API toggle changed to: ${newValue}`);
    
    // Save settings
    localStorage.setItem(USE_GEMINI_STORAGE_KEY, newValue.toString());
    
    if (newValue) {
      try {
        // Enable Gemini API
        setUseGeminiAPI(true);
        console.log('Gemini API enabled via setUseGeminiAPI(true)');
        showAlertMessage('Gemini AI enabled successfully', 'success');
      } catch (error) {
        console.error('Failed to initialize Gemini service:', error);
        showAlertMessage('Failed to initialize Gemini AI', 'error');
        setUseGemini(false);
        setUseGeminiAPI(false);
      }
    } else {
      // Disable Gemini
      setUseGeminiAPI(false);
      console.log('Gemini API disabled via setUseGeminiAPI(false)');
      showAlertMessage('Gemini AI disabled', 'info');
    }
  };

  // Show alert message
  const showAlertMessage = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1">Gemini AI</Typography>
          
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              console.log('Current Gemini state:');
              console.log('- useGemini state:', useGemini);
              console.log('- isUsingGeminiAPI():', isUsingGeminiAPI());
              showAlertMessage(`Gemini API is ${isUsingGeminiAPI() ? 'enabled' : 'disabled'}`, 'info');
            }}
          >
            Test
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Switch
            checked={useGemini}
            onChange={handleToggleChange}
            color="primary"
            size="small"
          />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {useGemini ? "Enabled" : "Disabled"}
          </Typography>
        </Box>
        
        <Collapse in={showAlert}>
          <Alert
            severity={alertSeverity}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setShowAlert(false)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mt: 1, py: 0 }}
          >
            {alertMessage}
          </Alert>
        </Collapse>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Using local chess engine. Enable Gemini AI for advanced capabilities.
        </Typography>
      </Box>
    </Paper>
  );
};

export default GeminiConfig;