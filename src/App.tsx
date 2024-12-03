import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { store } from './store/store';
import { StorageManagement } from './pages/StorageManagement';
import LandingPage from './components/LandingPage/LandingPage';
import Navbar from './components/Navigation/Navbar';
import StorageDashboard from './components/Storage/StorageDashboard';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import NotificationSystem from './components/Notifications/NotificationSystem';

const App: React.FC = () => {
  // Mock storage stats for demo
  const storageStats = {
    used: 75,
    total: 100,
    largeFiles: 12,
    oldFiles: 45,
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/storage" element={<StorageManagement />} />
              <Route 
                path="/dashboard" 
                element={<StorageDashboard stats={storageStats} />} 
              />
              {/* Add other routes here */}
            </Routes>
            <NotificationSystem />
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
