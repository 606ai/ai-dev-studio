import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button, Typography, Box, Container } from '@mui/material';
import { logError } from '@utils/logger';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="h4" color="error">
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error.message}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={resetErrorBoundary}
        >
          Try again
        </Button>
      </Box>
    </Container>
  );
};

export const GlobalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handleError = (error: Error, info: { componentStack: string }) => {
    logError('Global Error:', { error, info });
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Optional: Add any reset logic here
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
