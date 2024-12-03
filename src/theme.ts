import { createTheme, alpha } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4ecdc4',
      light: '#56CCF2',
      dark: '#2D9CDB',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6b6b',
      light: '#ff8787',
      dark: '#fa5252',
      contrastText: '#ffffff',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2a2a2a',
    },
    success: {
      main: '#96c93d',
      light: '#a9d62b',
      dark: '#82b022',
    },
    error: {
      main: '#e74c3c',
      light: '#ff6b6b',
      dark: '#c0392b',
    },
    warning: {
      main: '#f1c40f',
      light: '#fddb3a',
      dark: '#d35400',
    },
    info: {
      main: '#45b7d1',
      light: '#5bc0de',
      dark: '#3498db',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    body1: {
      fontSize: '1.1rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#1a1a1a',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#4ecdc4',
            borderRadius: '4px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '25px',
          padding: '12px 24px',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(5px)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #4ecdc4 30%, #56CCF2 90%)',
          boxShadow: '0 3px 15px rgba(78, 205, 196, 0.3)',
          '&:hover': {
            boxShadow: '0 5px 20px rgba(78, 205, 196, 0.5)',
          },
        },
        outlined: {
          borderColor: alpha('#4ecdc4', 0.5),
          '&:hover': {
            borderColor: '#4ecdc4',
            background: alpha('#4ecdc4', 0.1),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          background: `linear-gradient(135deg, ${alpha('#2a2a2a', 0.8)} 0%, ${alpha('#2a2a2a', 0.4)} 100%)`,
          border: `1px solid ${alpha('#ffffff', 0.1)}`,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: `0 8px 25px ${alpha('#000000', 0.2)}`,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          background: alpha('#1a1a1a', 0.8),
          boxShadow: 'none',
          borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          height: '8px',
          backgroundColor: alpha('#4ecdc4', 0.1),
        },
        bar: {
          borderRadius: '8px',
          background: 'linear-gradient(45deg, #4ecdc4 30%, #56CCF2 90%)',
        },
      },
    },
  },
});
