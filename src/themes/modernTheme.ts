import { createTheme } from '@mui/material/styles';

export const modernTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2D9CDB',
      light: '#56CCF2',
      dark: '#2F80ED',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#BB6BD9',
      light: '#F2C94C',
      dark: '#9B51E0',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0A0A0A',
      paper: '#141414',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    success: {
      main: '#27AE60',
      light: '#6FCF97',
      dark: '#219653',
    },
    error: {
      main: '#EB5757',
      light: '#FF8A8A',
      dark: '#C92A2A',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '4rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #2D9CDB 0%, #56CCF2 100%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #2F80ED 0%, #2D9CDB 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

export default modernTheme;
