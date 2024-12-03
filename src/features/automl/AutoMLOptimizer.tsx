import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Science,
  Speed,
  TrendingUp,
  CheckCircle,
  PlayArrow,
  Stop,
  Save,
  Compare,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

interface ModelCandidate {
  id: string;
  architecture: string;
  hyperparameters: {
    [key: string]: number | string;
  };
  performance: {
    accuracy: number;
    loss: number;
    latency: number;
    params: number;
  };
  status: 'training' | 'completed' | 'failed';
}

interface OptimizationMetrics {
  iteration: number;
  accuracy: number;
  loss: number;
  latency: number;
  timestamp: number;
}

const AutoMLOptimizer: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState<ModelCandidate[]>([]);
  const [metrics, setMetrics] = useState<OptimizationMetrics[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const steps = [
    'Architecture Search',
    'Hyperparameter Optimization',
    'Model Pruning',
    'Quantization',
  ];

  useEffect(() => {
    if (isOptimizing) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setActiveStep((prevStep) => {
              if (prevStep >= steps.length - 1) {
                setIsOptimizing(false);
                return prevStep;
              }
              return prevStep + 1;
            });
            return 0;
          }
          return prev + 2;
        });

        // Simulate new candidate discovery
        if (Math.random() > 0.8) {
          const newCandidate: ModelCandidate = {
            id: Date.now().toString(),
            architecture: 'EfficientNet-B' + Math.floor(Math.random() * 7),
            hyperparameters: {
              learningRate: 0.001 * Math.random(),
              batchSize: Math.floor(Math.random() * 128) + 32,
              dropout: Math.random() * 0.5,
            },
            performance: {
              accuracy: 0.85 + Math.random() * 0.1,
              loss: Math.random() * 0.5,
              latency: Math.random() * 100 + 50,
              params: Math.random() * 1e7,
            },
            status: 'completed',
          };
          setCandidates((prev) => [...prev, newCandidate]);
        }

        // Update optimization metrics
        const newMetric: OptimizationMetrics = {
          iteration: metrics.length + 1,
          accuracy: 0.8 + Math.random() * 0.15,
          loss: 0.1 + Math.random() * 0.2,
          latency: 50 + Math.random() * 100,
          timestamp: Date.now(),
        };
        setMetrics((prev) => [...prev, newMetric]);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOptimizing]);

  const handleOptimizationToggle = () => {
    setIsOptimizing(!isOptimizing);
  };

  const ParallelCoordinatesPlot = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={candidates}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="performance.accuracy"
          type="number"
          domain={[0.8, 1]}
          label={{ value: 'Accuracy', position: 'bottom' }}
        />
        <YAxis
          dataKey="performance.latency"
          domain={[0, 200]}
          label={{ value: 'Latency (ms)', angle: -90, position: 'left' }}
        />
        <RechartsTooltip />
        <Legend />
        {candidates.map((candidate) => (
          <Line
            key={candidate.id}
            type="monotone"
            data={[candidate.performance]}
            stroke={selectedCandidate === candidate.id ? '#ff0000' : '#8884d8'}
            strokeWidth={selectedCandidate === candidate.id ? 2 : 1}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">AutoML Optimizer</Typography>
        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="contained"
            startIcon={isOptimizing ? <Stop /> : <PlayArrow />}
            onClick={handleOptimizationToggle}
            color={isOptimizing ? 'error' : 'primary'}
          >
            {isOptimizing ? 'Stop Optimization' : 'Start Optimization'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {isOptimizing && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              {steps[activeStep]}: {progress}% Complete
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Optimization Progress
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="iteration" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#8884d8"
                  name="Accuracy"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="loss"
                  stroke="#82ca9d"
                  name="Loss"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Best Candidates
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell align="right">Accuracy</TableCell>
                    <TableCell align="right">Latency</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates
                    .sort(
                      (a, b) => b.performance.accuracy - a.performance.accuracy
                    )
                    .slice(0, 5)
                    .map((candidate) => (
                      <TableRow
                        key={candidate.id}
                        selected={selectedCandidate === candidate.id}
                        onClick={() => setSelectedCandidate(candidate.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{candidate.architecture}</TableCell>
                        <TableCell align="right">
                          {(candidate.performance.accuracy * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell align="right">
                          {candidate.performance.latency.toFixed(1)}ms
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Save Model">
                            <IconButton size="small">
                              <Save fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pareto Frontier
            </Typography>
            <ParallelCoordinatesPlot />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AutoMLOptimizer;
