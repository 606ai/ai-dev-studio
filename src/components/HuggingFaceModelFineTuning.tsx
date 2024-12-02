import React, { FC, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  LinearProgress,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import ScrollContainer from './ScrollContainer';
import huggingfaceService, { ModelTrainingConfig } from '../services/huggingfaceService';

const PREDEFINED_MODELS = [
  'bert-base-uncased',
  'roberta-base',
  'gpt2',
  'distilbert-base-uncased',
];

const SAMPLE_DATASETS = [
  'imdb',
  'squad',
  'glue',
  'wikitext',
];

const PerformanceChart: FC<{ 
  data: { epoch: number; accuracy: number; loss: number }[] 
}> = ({ data }) => {
  const maxAccuracy = Math.max(...data.map(d => d.accuracy));
  const maxLoss = Math.max(...data.map(d => d.loss));

  return (
    <Box sx={{ 
      width: '100%', 
      height: 300, 
      position: 'relative',
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 1,
      p: 2
    }}>
      <Box sx={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '100%',
        display: 'flex',
        flexDirection: 'row'
      }}>
        {data.map((point, index) => (
          <Box 
            key={point.epoch} 
            sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'flex-end',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <Box 
              sx={{ 
                width: '50%', 
                height: `${(point.accuracy / maxAccuracy) * 100}%`, 
                backgroundColor: '#8884d8',
                mb: 1
              }} 
              title={`Epoch ${point.epoch} Accuracy: ${point.accuracy.toFixed(2)}`}
            />
            <Box 
              sx={{ 
                width: '50%', 
                height: `${(point.loss / maxLoss) * 100}%`, 
                backgroundColor: '#82ca9d'
              }} 
              title={`Epoch ${point.epoch} Loss: ${point.loss.toFixed(2)}`}
            />
          </Box>
        ))}
      </Box>
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        display: 'flex', 
        justifyContent: 'space-between',
        p: 1
      }}>
        <Typography variant="caption">Accuracy/Loss</Typography>
        <Typography variant="caption">Epochs</Typography>
      </Box>
    </Box>
  );
};

const HuggingFaceModelFineTuning: FC = () => {
  const [selectedModel, setSelectedModel] = useState(PREDEFINED_MODELS[0]);
  const [dataset, setDataset] = useState(SAMPLE_DATASETS[0]);
  const [hyperparameters, setHyperparameters] = useState({
    learningRate: 0.00002,
    batchSize: 16,
    epochs: 3,
  });
  const [trainingStatus, setTrainingStatus] = useState<{
    inProgress: boolean;
    progress: number;
    metrics?: {
      accuracy: number[];
      loss: number[];
    };
    estimatedCost?: number;
    estimatedTime?: number;
  }>({
    inProgress: false,
    progress: 0,
  });

  const handleHyperparameterChange = (param: string, value: number) => {
    setHyperparameters(prev => ({
      ...prev,
      [param]: value,
    }));
  };

  const estimateTrainingCosts = async () => {
    try {
      const config: ModelTrainingConfig = {
        model: selectedModel,
        dataset,
        hyperparameters,
      };

      const costEstimate = await huggingfaceService.estimateTrainingCosts(config);
      
      setTrainingStatus(prev => ({
        ...prev,
        estimatedCost: costEstimate.estimatedCost,
        estimatedTime: costEstimate.estimatedTime,
      }));
    } catch (error) {
      console.error('Cost estimation failed', error);
    }
  };

  const startFineTuning = async () => {
    setTrainingStatus({ inProgress: true, progress: 0 });

    try {
      const config: ModelTrainingConfig = {
        model: selectedModel,
        dataset,
        hyperparameters,
      };

      // Simulate training progress
      const updateProgress = (progress: number) => {
        setTrainingStatus(prev => ({
          ...prev,
          progress,
        }));
      };

      // Start fine-tuning
      const result = await huggingfaceService.fineTuneModel(config);

      // Fetch performance metrics
      const metrics = await huggingfaceService.generateModelPerformanceMetrics(selectedModel);

      setTrainingStatus({
        inProgress: false,
        progress: 100,
        metrics: {
          accuracy: metrics.accuracy,
          loss: metrics.loss,
        },
      });
    } catch (error) {
      console.error('Fine-tuning failed', error);
      setTrainingStatus({ 
        inProgress: false, 
        progress: 0 
      });
    }
  };

  const performanceData = trainingStatus.metrics ? 
    trainingStatus.metrics.accuracy.map((acc, index) => ({
      epoch: index + 1,
      accuracy: acc,
      loss: trainingStatus.metrics?.loss[index] || 0,
    })) : 
    [];

  return (
    <ScrollContainer>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Hugging Face Model Fine-Tuning
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Base Model</InputLabel>
                <Select
                  value={selectedModel}
                  label="Base Model"
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {PREDEFINED_MODELS.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Dataset</InputLabel>
                <Select
                  value={dataset}
                  label="Dataset"
                  onChange={(e) => setDataset(e.target.value)}
                >
                  {SAMPLE_DATASETS.map((ds) => (
                    <MenuItem key={ds} value={ds}>
                      {ds}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Learning Rate</Typography>
                <Slider
                  value={hyperparameters.learningRate}
                  onChange={(_, newValue) => handleHyperparameterChange('learningRate', newValue as number)}
                  step={0.00001}
                  min={0.00001}
                  max={0.001}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Batch Size</Typography>
                <Slider
                  value={hyperparameters.batchSize}
                  onChange={(_, newValue) => handleHyperparameterChange('batchSize', newValue as number)}
                  step={8}
                  min={8}
                  max={64}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Epochs</Typography>
                <Slider
                  value={hyperparameters.epochs}
                  onChange={(_, newValue) => handleHyperparameterChange('epochs', newValue as number)}
                  step={1}
                  min={1}
                  max={10}
                />
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    onClick={estimateTrainingCosts}
                  >
                    Estimate Costs
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={startFineTuning}
                    disabled={trainingStatus.inProgress}
                  >
                    {trainingStatus.inProgress ? 'Training...' : 'Start Fine-Tuning'}
                  </Button>
                </Grid>
              </Grid>

              {trainingStatus.estimatedCost && (
                <Card sx={{ mt: 2 }}>
                  <CardHeader 
                    title="Training Estimate" 
                    titleTypographyProps={{ variant: 'subtitle2' }}
                  />
                  <CardContent>
                    <Typography variant="body2">
                      Estimated Cost: ${trainingStatus.estimatedCost.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Estimated Time: {trainingStatus.estimatedTime} minutes
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              {trainingStatus.inProgress && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={trainingStatus.progress} 
                  />
                  <Typography variant="body2" align="center">
                    Training Progress: {trainingStatus.progress.toFixed(2)}%
                  </Typography>
                </Box>
              )}

              {trainingStatus.metrics && (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Training Performance
                  </Typography>
                  <PerformanceChart data={performanceData} />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </ScrollContainer>
  );
};

export default HuggingFaceModelFineTuning;
