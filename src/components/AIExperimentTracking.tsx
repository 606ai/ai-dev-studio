import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Chip
} from '@mui/material';
import { 
  Science as ScienceIcon, 
  CheckCircle as CheckCircleIcon, 
  Error as ErrorIcon,
  Pending as PendingIcon
} from '@mui/icons-material';

interface Experiment {
  id: string;
  name: string;
  model: string;
  dataset: string;
  status: 'running' | 'completed' | 'failed';
  metrics: {
    accuracy: number;
    loss: number;
    trainingTime: number;
  };
}

export const AIExperimentTracking: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([
    {
      id: '1',
      name: 'Image Classification V1',
      model: 'ResNet50',
      dataset: 'ImageNet Subset',
      status: 'completed',
      metrics: {
        accuracy: 92.5,
        loss: 0.15,
        trainingTime: 3.2
      }
    },
    {
      id: '2',
      name: 'Sentiment Analysis',
      model: 'BERT Large',
      dataset: 'IMDB Reviews',
      status: 'running',
      metrics: {
        accuracy: 85.3,
        loss: 0.25,
        trainingTime: 1.7
      }
    }
  ]);

  const getStatusIcon = (status: Experiment['status']) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'running': return <PendingIcon color="primary" />;
      case 'failed': return <ErrorIcon color="error" />;
    }
  };

  const getStatusColor = (status: Experiment['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'failed': return 'error';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        AI Experiment Tracking
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}
          >
            <ScienceIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6">Experiment Overview</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Chip 
                label={`Total: ${experiments.length}`} 
                color="default" 
                size="small" 
              />
              <Chip 
                label={`Completed: ${experiments.filter(e => e.status === 'completed').length}`} 
                color="success" 
                size="small" 
              />
              <Chip 
                label={`Running: ${experiments.filter(e => e.status === 'running').length}`} 
                color="primary" 
                size="small" 
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Experiments
            </Typography>
            <List>
              {experiments.map((experiment) => (
                <ListItem key={experiment.id} divider>
                  <ListItemIcon>
                    {getStatusIcon(experiment.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">
                          {experiment.name}
                        </Typography>
                        <Chip 
                          label={experiment.status} 
                          size="small" 
                          color={getStatusColor(experiment.status)} 
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Model: {experiment.model} | Dataset: {experiment.dataset}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Typography variant="caption">
                            Accuracy: {experiment.metrics.accuracy.toFixed(2)}%
                          </Typography>
                          <Typography variant="caption">
                            Loss: {experiment.metrics.loss.toFixed(2)}
                          </Typography>
                          <Typography variant="caption">
                            Training Time: {experiment.metrics.trainingTime} hrs
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIExperimentTracking;
