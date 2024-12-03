import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  useTheme,
  alpha,
  IconButton,
} from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';
import CodeIcon from '@mui/icons-material/Code';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SpeedIcon from '@mui/icons-material/Speed';

const MotionBox = motion(Box);
const MotionTypography = motion(Typography);

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], ['0%', '50%']);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      title: 'AI Code Generation',
      description: 'Generate high-quality code with advanced AI models',
      icon: <AutoFixHighIcon sx={{ fontSize: 40 }} />,
      delay: 0.2,
    },
    {
      title: 'Real-time Collaboration',
      description: 'Work together seamlessly with your team',
      icon: <CodeIcon sx={{ fontSize: 40 }} />,
      delay: 0.4,
    },
    {
      title: 'Smart Suggestions',
      description: 'Get intelligent code suggestions as you type',
      icon: <SmartToyIcon sx={{ fontSize: 40 }} />,
      delay: 0.6,
    },
    {
      title: 'Performance Analytics',
      description: 'Monitor and optimize your code performance',
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      delay: 0.8,
    },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
    }}>
      {/* Animated Background */}
      <MotionBox
        style={{ y: backgroundY }}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 60%)`,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 15, md: 20 }, pb: 15, position: 'relative' }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <MotionBox
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <MotionTypography
                variant="h1"
                gutterBottom
                sx={{
                  background: 'linear-gradient(45deg, #4ecdc4 30%, #56CCF2 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                }}
              >
                The Future of
                <br />
                AI Development
              </MotionTypography>
              <Typography
                variant="h4"
                color="text.secondary"
                gutterBottom
                sx={{ mb: 4, fontWeight: 'light' }}
              >
                Build, test, and deploy AI-powered applications with unprecedented speed and precision.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                >
                  Watch Demo
                </Button>
              </Box>
            </MotionBox>
          </Grid>
          <Grid item xs={12} md={6}>
            <MotionBox
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              sx={{
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-20%',
                  right: '-20%',
                  width: '140%',
                  height: '140%',
                  background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
                  zIndex: -1,
                },
              }}
            >
              <Box
                component="img"
                src="/code-editor.png"
                alt="AI Dev Studio Interface"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '16px',
                  boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`,
                }}
              />
            </MotionBox>
          </Grid>
        </Grid>

        {/* Features Section */}
        <Box sx={{ mt: 15 }}>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <MotionBox
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: feature.delay }}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 4,
                    backdropFilter: 'blur(10px)',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <IconButton
                    sx={{
                      mb: 2,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                      color: 'white',
                      '&:hover': { transform: 'scale(1.1)' },
                    }}
                  >
                    {feature.icon}
                  </IconButton>
                  <Typography variant="h5" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
