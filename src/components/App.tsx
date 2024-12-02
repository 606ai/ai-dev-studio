import React, { useState } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Container,
  Grid
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  ModelTraining as ModelTrainingIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Science as ScienceIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';

// Hugging Face Components
import HuggingFaceModelBrowser from './HuggingFaceModelBrowser';
import HuggingFacePlayground from './HuggingFacePlayground';
import HuggingFaceModelFineTuning from './HuggingFaceModelFineTuning';
import HuggingFaceAPIConfig from './HuggingFaceAPIConfig';

// New Components
import AICodeCompletionPlugin from '../plugins/AICodeCompletionPlugin';
import PerformanceMonitorDashboard from './PerformanceMonitorDashboard';
import AIModelComparator from './AIModelComparator';
import AIProjectTemplateGenerator from './AIProjectTemplateGenerator';
import AIEthicsBiasDetector from './AIEthicsBiasDetector';
import RealTimeCollaborationWorkspace from './RealTimeCollaborationWorkspace';
import AIModelVersionControl from './AIModelVersionControl';
import AIDatasetManagement from './AIDatasetManagement';
import AIExperimentTracking from './AIExperimentTracking';
import AIResourceAllocationDashboard from './AIResourceAllocationDashboard';

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1d1d1d',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: 240,
          backgroundColor: '#1d1d1d',
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<string>('dashboard');

  const renderContent = () => {
    switch (selectedSection) {
      case 'dashboard':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <PerformanceMonitorDashboard />
            </Grid>
            <Grid item xs={12} md={6}>
              <AIResourceAllocationDashboard />
            </Grid>
            <Grid item xs={12} md={6}>
              <AIExperimentTracking />
            </Grid>
            <Grid item xs={12} md={6}>
              <AIModelVersionControl />
            </Grid>
          </Grid>
        );
      case 'model-browser':
        return <HuggingFaceModelBrowser />;
      case 'playground':
        return <HuggingFacePlayground />;
      case 'fine-tuning':
        return <HuggingFaceModelFineTuning />;
      case 'api-config':
        return <HuggingFaceAPIConfig />;
      case 'code-completion':
        return <AICodeCompletionPlugin currentCode="" language="typescript" />;
      case 'model-comparator':
        return <AIModelComparator />;
      case 'project-templates':
        return <AIProjectTemplateGenerator />;
      case 'ethics-detector':
        return <AIEthicsBiasDetector />;
      case 'collaboration':
        return <RealTimeCollaborationWorkspace />;
      case 'dataset-management':
        return <AIDatasetManagement />;
      default:
        return <Typography>Select a section</Typography>;
    }
  };

  const sidebarSections = [
    { 
      name: 'dashboard', 
      label: 'Dashboard', 
      icon: <DashboardIcon /> 
    },
    { 
      name: 'model-browser', 
      label: 'Model Browser', 
      icon: <CloudIcon /> 
    },
    { 
      name: 'playground', 
      label: 'Playground', 
      icon: <ScienceIcon /> 
    },
    { 
      name: 'fine-tuning', 
      label: 'Fine-Tuning', 
      icon: <ModelTrainingIcon /> 
    },
    { 
      name: 'api-config', 
      label: 'API Config', 
      icon: <SettingsIcon /> 
    },
    { 
      name: 'code-completion', 
      label: 'Code Completion', 
      icon: <CodeIcon /> 
    },
    { 
      name: 'model-comparator', 
      label: 'Model Comparator', 
      icon: <AnalyticsIcon /> 
    },
    { 
      name: 'project-templates', 
      label: 'Project Templates', 
      icon: <StorageIcon /> 
    },
    { 
      name: 'ethics-detector', 
      label: 'Ethics Detector', 
      icon: <SecurityIcon /> 
    },
    { 
      name: 'collaboration', 
      label: 'Collaboration', 
      icon: <MemoryIcon /> 
    },
    { 
      name: 'dataset-management', 
      label: 'Dataset Management', 
      icon: <StorageIcon /> 
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper 
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap>
              AI Development Studio
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: 240, 
              boxSizing: 'border-box',
              top: 64,
              backgroundColor: theme.palette.background.paper
            },
          }}
        >
          <List>
            {sidebarSections.map((section) => (
              <ListItem 
                key={section.name}
                button 
                selected={selectedSection === section.name}
                onClick={() => setSelectedSection(section.name)}
              >
                <ListItemIcon>{section.icon}</ListItemIcon>
                <ListItemText primary={section.label} />
              </ListItem>
            ))}
          </List>
        </Drawer>
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            mt: '64px',
            backgroundColor: theme.palette.background.default 
          }}
        >
          <Container maxWidth="xl">
            {renderContent()}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
