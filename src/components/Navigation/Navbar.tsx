import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  alpha,
  ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SpeedIcon from '@mui/icons-material/Speed';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleTheme, removeNotification } from '../store/uiSlice';

const MotionAppBar = motion(AppBar);
const MotionButton = motion(Button);
const MotionIconButton = motion(IconButton);

const menuItems = [
  { title: 'Features', path: '/features', icon: <AutoFixHighIcon /> },
  { title: 'Docs', path: '/docs', icon: <CodeIcon /> },
  { title: 'Models', path: '/models', icon: <SmartToyIcon /> },
  { title: 'Analytics', path: '/analytics', icon: <SpeedIcon /> },
];

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { theme: themeMode, notifications } = useAppSelector((state) => state.ui);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleNotificationClose = (id: string) => {
    dispatch(removeNotification(id));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
          theme.palette.background.paper,
          0.95
        )} 100%)`,
        backdropFilter: 'blur(10px)',
        borderLeft: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <MotionIconButton
          onClick={handleDrawerToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <CloseIcon />
        </MotionIconButton>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.title}
            onClick={() => handleNavigation(item.path)}
            sx={{
              my: 1,
              mx: 2,
              borderRadius: 2,
              background: location.pathname === item.path
                ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)} 30%, ${alpha(
                    theme.palette.primary.light,
                    0.1
                  )} 90%)`
                : 'transparent',
              '&:hover': {
                background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 30%, ${alpha(
                  theme.palette.primary.light,
                  0.05
                )} 90%)`,
              },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.primary.main }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <MotionAppBar
        position="fixed"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          background: isScrolled
            ? alpha(theme.palette.background.default, 0.8)
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(10px)' : 'none',
          boxShadow: isScrolled
            ? `0 4px 30px ${alpha(theme.palette.common.black, 0.1)}`
            : 'none',
          borderBottom: isScrolled
            ? `1px solid ${alpha(theme.palette.common.white, 0.1)}`
            : 'none',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: isScrolled ? 1 : 1.5 }}>
            <Typography
              variant="h6"
              component={motion.div}
              onClick={() => handleNavigation('/')}
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                cursor: 'pointer',
                background: 'linear-gradient(45deg, #4ecdc4 30%, #56CCF2 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
              whileHover={{ scale: 1.05 }}
            >
              <SmartToyIcon sx={{ fontSize: 28 }} /> AI Dev Studio
            </Typography>

            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {menuItems.map((item) => (
                  <MotionButton
                    key={item.title}
                    color="inherit"
                    onClick={() => handleNavigation(item.path)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    sx={{
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: location.pathname === item.path ? '100%' : '0%',
                        height: '2px',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(45deg, #4ecdc4 30%, #56CCF2 90%)',
                        transition: 'width 0.3s ease-in-out',
                      },
                      '&:hover::after': {
                        width: '100%',
                      },
                    }}
                  >
                    {item.title}
                  </MotionButton>
                ))}
                <MotionButton
                  variant="contained"
                  onClick={() => handleNavigation('/signup')}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </MotionButton>
              </Box>
            )}

            {isMobile && (
              <MotionIconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <MenuIcon />
              </MotionIconButton>
            )}
          </Toolbar>
        </Container>
      </MotionAppBar>

      <AnimatePresence>
        {mobileOpen && (
          <Drawer
            variant="temporary"
            anchor="right"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                width: 280,
                background: 'transparent',
                boxShadow: 'none',
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
