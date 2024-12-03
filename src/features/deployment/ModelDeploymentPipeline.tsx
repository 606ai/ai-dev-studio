import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  CloudUpload,
  Speed,
  Security,
  Build,
  PlayArrow,
} from '@mui/icons-material';

interface DeploymentStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: string[];
  metrics?: {
    accuracy: number;
    latency: number;
    memory: number;
  };
}

const ModelDeploymentPipeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [stages, setStages] = useState<DeploymentStage[]>([
    { name: 'Model Validation', status: 'pending', logs: [] },
    { name: 'Performance Testing', status: 'pending', logs: [] },
    { name: 'Security Scan', status: 'pending', logs: [] },
    { name: 'Build Container', status: 'pending', logs: [] },
    { name: 'Deploy to Production', status: 'pending', logs: [] },
  ]);

  const runDeployment = async () => {
    for (let i = 0; i < stages.length; i++) {
      setActiveStep(i);
      setStages(prev => {
        const newStages = [...prev];
        newStages[i] = { ...newStages[i], status: 'running' };
        return newStages;
      });

      // Simulate stage execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      setStages(prev => {
        const newStages = [...prev];
        newStages[i] = {
          ...newStages[i],
          status: 'completed',
          metrics: {
            accuracy: 0.95,
            latency: 150,
            memory: 512,
          },
          logs: ['Stage completed successfully', 'All tests passed'],
        };
        return newStages;
      });
    }
  };

  const StageIcon = ({ stage }: { stage: DeploymentStage }) => {
    switch (stage.status) {
      case 'running':
        return <CircularProgress size={20} />;
      case 'completed':
        return <TimelineDot color="success" />;
      case 'failed':
        return <TimelineDot color="error" />;
      default:
        return <TimelineDot />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Model Deployment Pipeline
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Stepper activeStep={activeStep}>
              {stages.map((stage, index) => (
                <Step key={stage.name}>
                  <StepLabel
                    StepIconProps={{
                      icon: index + 1,
                      active: stage.status === 'running',
                      completed: stage.status === 'completed',
                    }}
                  >
                    {stage.name}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={runDeployment}
                disabled={stages.some(s => s.status === 'running')}
              >
                Start Deployment
              </Button>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Deployment Timeline
            </Typography>

            <Timeline>
              {stages.map((stage, index) => (
                <TimelineItem key={stage.name}>
                  <TimelineSeparator>
                    <StageIcon stage={stage} />
                    {index < stages.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle1">{stage.name}</Typography>
                    {stage.status === 'completed' && stage.metrics && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          Accuracy: {stage.metrics.accuracy.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Latency: {stage.metrics.latency}ms
                        </Typography>
                        <Typography variant="caption" display="block">
                          Memory: {stage.metrics.memory}MB
                        </Typography>
                      </Box>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Deployment Logs
            </Typography>

            {stages.map((stage) => (
              stage.logs.length > 0 && (
                <Card key={stage.name} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      {stage.name}
                    </Typography>
                    {stage.logs.map((log, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {log}
                      </Typography>
                    ))}
                  </CardContent>
                </Card>
              )
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelDeploymentPipeline;
