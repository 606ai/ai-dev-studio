import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Button, Typography, Box, Container, Paper } from '@mui/material';
import { logError } from '@utils/logger';
import { usePerformance } from '@hooks/usePerformance';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  name?: string;
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const { measureOperation } = usePerformance('ErrorFallback');

  const handleReset = () => {
    measureOperation('reset', resetErrorBoundary);
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Oops! Something went wrong
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center">
          {error.message}
        </Typography>

        {process.env.NODE_ENV === 'development' && (
          <Box
            component="pre"
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              overflow: 'auto',
              maxWidth: '100%',
            }}
          >
            {error.stack}
          </Box>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReset}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export const AppErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, name = 'AppComponent' }) => {
  const handleError = (error: Error, info: { componentStack: string }) => {
    logError(`Error in ${name}:`, { error, info });
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Optional: Add any reset logic here
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
