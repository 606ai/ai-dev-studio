import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Divider
} from '@mui/material';
import { 
  Save as SaveIcon, 
  CloudUpload as CloudUploadIcon,
  Sync as SyncIcon
} from '@mui/icons-material';

interface ModelVersion {
  id: string;
  version: string;
  date: string;
  changes: string[];
  status: 'local' | 'synced' | 'published';
}

export const AIModelVersionControl: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([
    {
      id: '1',
      version: 'v0.1.0',
      date: '2023-06-15',
      changes: ['Initial model architecture', 'Basic training setup'],
      status: 'local'
    },
    {
      id: '2',
      version: 'v0.2.0',
      date: '2023-06-22',
      changes: ['Improved accuracy', 'Added data augmentation'],
      status: 'synced'
    },
    {
      id: '3',
      version: 'v0.3.0',
      date: '2023-07-01',
      changes: ['Optimized hyperparameters', 'Enhanced generalization'],
      status: 'published'
    }
  ]);

  const getStatusIcon = (status: ModelVersion['status']) => {
    switch (status) {
      case 'local': return <SaveIcon color="disabled" />;
      case 'synced': return <SyncIcon color="primary" />;
      case 'published': return <CloudUploadIcon color="success" />;
    }
  };

  const getStatusColor = (status: ModelVersion['status']) => {
    switch (status) {
      case 'local': return 'default';
      case 'synced': return 'primary';
      case 'published': return 'success';
    }
  };

  const handleStep = (step: number) => {
    setActiveStep(step);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        AI Model Version Control
      </Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {modelVersions.map((version, index) => (
            <Step key={version.id}>
              <StepLabel
                optional={
                  <Typography variant="caption">
                    {version.date}
                  </Typography>
                }
                StepIconComponent={() => getStatusIcon(version.status)}
                onClick={() => handleStep(index)}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{version.version}</Typography>
                  <Chip 
                    label={version.status} 
                    size="small" 
                    color={getStatusColor(version.status)} 
                  />
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Changes:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {version.changes.map((change, idx) => (
                    <Typography 
                      key={idx} 
                      component="li" 
                      variant="body2"
                    >
                      {change}
                    </Typography>
                  ))}
                </Box>
                {index < modelVersions.length - 1 && <Divider sx={{ my: 2 }} />}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};

export default AIModelVersionControl;
