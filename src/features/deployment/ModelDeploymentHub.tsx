import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Cloud,
  Memory,
  PhoneAndroid,
  Computer,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  CloudDownload,
  Code,
} from '@mui/icons-material';

interface DeploymentTarget {
  id: string;
  name: string;
  type: 'cloud' | 'edge' | 'mobile' | 'browser';
  icon: React.ReactNode;
  status: 'running' | 'stopped' | 'deploying' | 'error';
  metrics: {
    requests: number;
    latency: number;
    memory: number;
    uptime: number;
  };
}

interface DeploymentConfig {
  runtime: string;
  version: string;
  resources: {
    cpu: string;
    memory: string;
    gpu: string;
  };
  scaling: {
    min: number;
    max: number;
    target: number;
  };
}

const ModelDeploymentHub: React.FC = () => {
  const [deployments, setDeployments] = useState<DeploymentTarget[]>([
    {
      id: 'aws-1',
      name: 'AWS Production',
      type: 'cloud',
      icon: <Cloud />,
      status: 'running',
      metrics: {
        requests: 1234567,
        latency: 123,
        memory: 2048,
        uptime: 99.99,
      },
    },
    {
      id: 'edge-1',
      name: 'Edge Device',
      type: 'edge',
      icon: <Memory />,
      status: 'running',
      metrics: {
        requests: 45678,
        latency: 45,
        memory: 512,
        uptime: 98.5,
      },
    },
    {
      id: 'mobile-1',
      name: 'Mobile App',
      type: 'mobile',
      icon: <PhoneAndroid />,
      status: 'stopped',
      metrics: {
        requests: 0,
        latency: 0,
        memory: 0,
        uptime: 0,
      },
    },
    {
      id: 'browser-1',
      name: 'Web Browser',
      type: 'browser',
      icon: <Computer />,
      status: 'running',
      metrics: {
        requests: 89012,
        latency: 78,
        memory: 256,
        uptime: 99.5,
      },
    },
  ]);

  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(
    null
  );
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  const deploymentSteps = [
    'Model Optimization',
    'Package Creation',
    'Environment Setup',
    'Deployment',
    'Health Check',
  ];

  const handleDeploy = (deploymentId: string) => {
    setSelectedDeployment(deploymentId);
    setDeployDialogOpen(true);
    setActiveStep(0);
    setDeploymentError(null);

    // Simulate deployment process
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= deploymentSteps.length - 1) {
          clearInterval(interval);
          // Update deployment status
          setDeployments((prev) =>
            prev.map((d) =>
              d.id === deploymentId
                ? { ...d, status: 'running' }
                : d
            )
          );
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  const handleStop = (deploymentId: string) => {
    setDeployments((prev) =>
      prev.map((d) =>
        d.id === deploymentId
          ? { ...d, status: 'stopped', metrics: { ...d.metrics, requests: 0 } }
          : d
      )
    );
  };

  const DeploymentCard = ({ deployment }: { deployment: DeploymentTarget }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {deployment.icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {deployment.name}
          </Typography>
          <Chip
            label={deployment.status}
            color={
              deployment.status === 'running'
                ? 'success'
                : deployment.status === 'error'
                ? 'error'
                : 'default'
            }
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Requests
            </Typography>
            <Typography variant="h6">
              {deployment.metrics.requests.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Latency
            </Typography>
            <Typography variant="h6">
              {deployment.metrics.latency}ms
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Memory
            </Typography>
            <Typography variant="h6">
              {deployment.metrics.memory}MB
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Uptime
            </Typography>
            <Typography variant="h6">
              {deployment.metrics.uptime}%
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        {deployment.status === 'running' ? (
          <Button
            startIcon={<Stop />}
            color="error"
            onClick={() => handleStop(deployment.id)}
          >
            Stop
          </Button>
        ) : (
          <Button
            startIcon={<PlayArrow />}
            color="primary"
            onClick={() => handleDeploy(deployment.id)}
          >
            Deploy
          </Button>
        )}
        <Button
          startIcon={<Settings />}
          onClick={() => {
            setSelectedDeployment(deployment.id);
            setConfigDialogOpen(true);
          }}
        >
          Configure
        </Button>
        <Button startIcon={<Code />}>Endpoints</Button>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Model Deployment Hub</Typography>
        <Button
          variant="contained"
          startIcon={<CloudDownload />}
          sx={{ ml: 'auto' }}
          onClick={() => setDeployDialogOpen(true)}
        >
          New Deployment
        </Button>
      </Box>

      <Grid container spacing={3}>
        {deployments.map((deployment) => (
          <Grid item key={deployment.id} xs={12} md={6} lg={4}>
            <DeploymentCard deployment={deployment} />
          </Grid>
        ))}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Deployment Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Runtime</InputLabel>
                <Select value="tensorflow" label="Runtime">
                  <MenuItem value="tensorflow">TensorFlow</MenuItem>
                  <MenuItem value="pytorch">PyTorch</MenuItem>
                  <MenuItem value="onnx">ONNX Runtime</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Memory Limit"
                defaultValue="2048"
                helperText="Memory limit in MB"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CPU Cores"
                defaultValue="2"
                helperText="Number of CPU cores"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>GPU Support</InputLabel>
                <Select value="none" label="GPU Support">
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="nvidia">NVIDIA GPU</MenuItem>
                  <MenuItem value="tpu">Google TPU</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setConfigDialogOpen(false)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deployment Progress Dialog */}
      <Dialog
        open={deployDialogOpen}
        onClose={() => setDeployDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Deploying Model</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
            {deploymentSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {deploymentError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deploymentError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeployDialogOpen(false)}
            disabled={activeStep < deploymentSteps.length - 1}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelDeploymentHub;
