import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { StorageManagement } from './pages/StorageManagement';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/storage" element={<StorageManagement />} />
          {/* Add other routes here */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
