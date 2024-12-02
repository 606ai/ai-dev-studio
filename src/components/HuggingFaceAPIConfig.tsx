import React, { FC, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import huggingfaceService from '../services/huggingfaceService';

const HuggingFaceAPIConfig: FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Retrieve stored API key from secure storage
    const storedApiKey = localStorage.getItem('HUGGINGFACE_API_KEY');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSaveAPIKey = () => {
    // Basic validation
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'API Key cannot be empty'
      });
      return;
    }

    // Save to local storage (Note: In a production app, use more secure storage)
    localStorage.setItem('HUGGINGFACE_API_KEY', apiKey.trim());
    
    // Update service with new API key
    huggingfaceService.setApiKey(apiKey.trim());

    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsValidating(true);
    setTestResult(null);

    try {
      // Test connection by fetching a sample model
      const models = await huggingfaceService.listTrendingModels(1);
      
      if (models && models.length > 0) {
        setTestResult({
          success: true,
          message: 'API Key is valid! Connection successful.'
        });
      } else {
        setTestResult({
          success: false,
          message: 'Unable to fetch models. Please check your API Key.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Hugging Face API Configuration
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Hugging Face API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type={showApiKey ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <Tooltip title={showApiKey ? 'Hide API Key' : 'Show API Key'}>
                    <IconButton
                      onClick={() => setShowApiKey(!showApiKey)}
                      edge="end"
                    >
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                )
              }}
              sx={{ mb: 2 }}
              helperText="Your Hugging Face API key for authenticated requests"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSaveAPIKey}
            >
              Save API Key
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={handleTestConnection}
              disabled={isValidating || !apiKey.trim()}
            >
              {isValidating ? 'Validating...' : 'Test Connection'}
            </Button>
          </Grid>

          {testResult && (
            <Grid item xs={12}>
              <Alert 
                severity={testResult.success ? 'success' : 'error'}
                onClose={() => setTestResult(null)}
              >
                <AlertTitle>
                  {testResult.success ? 'Connection Successful' : 'Connection Error'}
                </AlertTitle>
                {testResult.message}
              </Alert>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Note: API keys are stored locally and used for Hugging Face API interactions.
            Ensure you keep your API key confidential.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default HuggingFaceAPIConfig;
