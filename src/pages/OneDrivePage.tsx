import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload, Storage } from '@mui/icons-material';
import { useOneDrive } from '../hooks/useOneDrive';
import { StorageManager } from '../components/StorageManager/StorageManager';
import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: '8f251dcd-956d-4e20-8e25-d37b31567028',
    authority: 'https://login.microsoftonline.com/0d1c9478-ea7d-4c2e-a295-210684c044cf',
    redirectUri: window.location.origin,
  },
};

const OneDrivePage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const oneDrive = useOneDrive();
  const pca = new PublicClientApplication(msalConfig);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accounts = pca.getAllAccounts();
        if (accounts.length > 0) {
          const result = await pca.acquireTokenSilent({
            scopes: ['Files.ReadWrite.All'],
            account: accounts[0],
          });
          await oneDrive.initialize(result);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await pca.loginPopup({
        scopes: ['Files.ReadWrite.All'],
      });
      if (result) {
        await oneDrive.initialize(result);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
      console.error('Login error:', error);
    }
    setIsLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        OneDrive Storage Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!isAuthenticated ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Storage sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Connect to OneDrive
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Sign in with your Microsoft account to manage your OneDrive storage
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={isLoading ? <CircularProgress size={20} /> : <CloudUpload />}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect to OneDrive'}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StorageManager />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default OneDrivePage;
