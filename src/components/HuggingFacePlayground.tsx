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
  CircularProgress,
  styled,
  Tooltip,
  IconButton,
} from '@mui/material';
import { ContentCopy as CopyIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { huggingfaceService } from '../services/huggingfaceService';
import { CustomScrollbar } from '../components/CustomScrollbar';

const TASK_MODELS = {
  'text-generation': [
    'gpt2',
    'EleutherAI/gpt-neo-125M',
    'facebook/opt-350m',
  ],
  'text-classification': [
    'distilbert-base-uncased-finetuned-sst-2-english',
    'facebook/bart-large-mnli',
  ],
  'question-answering': [
    'deepset/roberta-base-squad2',
    'bert-large-uncased-whole-word-masking-finetuned-squad',
  ],
  'summarization': [
    'facebook/bart-large-cnn',
    'google/pegasus-xsum',
  ],
  'translation': [
    'Helsinki-NLP/opus-mt-en-de',
    'Helsinki-NLP/opus-mt-fr-en',
  ],
} as const;

type TaskType = keyof typeof TASK_MODELS;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
}));

const ParameterSlider = styled(Box)(({ theme }) => ({
  '& .MuiSlider-root': {
    color: theme.palette.primary.main,
  },
  '& .MuiSlider-thumb': {
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}33`,
    },
  },
}));

interface Parameters {
  maxLength: number;
  temperature: number;
  topK: number;
  topP: number;
}

const HuggingFacePlayground: FC = () => {
  const [task, setTask] = useState<TaskType>('text-generation');
  const [selectedModel, setSelectedModel] = useState(TASK_MODELS['text-generation'][0]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Parameters>({
    maxLength: 100,
    temperature: 0.7,
    topK: 50,
    topP: 0.95,
  });

  const handleTaskChange = (newTask: TaskType) => {
    setTask(newTask);
    setSelectedModel(TASK_MODELS[newTask][0]);
    setInput('');
    setResult(null);
    setError(null);
  };

  const handleCopyResult = () => {
    const resultText = renderResult();
    if (resultText) {
      navigator.clipboard.writeText(resultText);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    setError(null);
    setParameters({
      maxLength: 100,
      temperature: 0.7,
      topK: 50,
      topP: 0.95,
    });
  };

  const handleInference = async () => {
    if (!selectedModel || !input) return;

    setLoading(true);
    setError(null);
    try {
      const response = await huggingfaceService.inference({
        model: selectedModel,
        inputs: input,
        parameters: {
          max_length: parameters.maxLength,
          temperature: parameters.temperature,
          top_k: parameters.topK,
          top_p: parameters.topP,
        }
      });
      setResult(response);
    } catch (error) {
      console.error('Inference failed', error);
      setError('Failed to get inference results. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    switch (task) {
      case 'text-generation':
        return result[0]?.generated_text || 'No text generated';
      case 'text-classification':
        return result.map((r: any) => 
          `${r.label}: ${(r.score * 100).toFixed(2)}%`
        ).join('\n');
      case 'question-answering':
        return `Answer: ${result.answer}\nScore: ${result.score.toFixed(2)}`;
      case 'summarization':
        return result[0]?.summary_text || 'No summary generated';
      case 'translation':
        return result[0]?.translation_text || 'No translation generated';
      default:
        return JSON.stringify(result, null, 2);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Hugging Face Playground
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StyledPaper>
            <FormControl fullWidth>
              <InputLabel>Task</InputLabel>
              <Select
                value={task}
                label="Task"
                onChange={(e) => handleTaskChange(e.target.value as TaskType)}
              >
                {Object.keys(TASK_MODELS).map((taskType) => (
                  <MenuItem key={taskType} value={taskType}>
                    {taskType.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {TASK_MODELS[task].map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label={`Input for ${task.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              error={Boolean(error)}
              helperText={error}
            />

            <ParameterSlider>
              <Typography variant="subtitle2" gutterBottom>
                Max Length: {parameters.maxLength}
              </Typography>
              <Slider
                value={parameters.maxLength}
                onChange={(_, newValue) => setParameters(prev => ({ 
                  ...prev, 
                  maxLength: newValue as number 
                }))}
                step={10}
                min={10}
                max={500}
                marks={[
                  { value: 10, label: '10' },
                  { value: 500, label: '500' }
                ]}
              />
            </ParameterSlider>

            <ParameterSlider>
              <Typography variant="subtitle2" gutterBottom>
                Temperature: {parameters.temperature.toFixed(2)}
              </Typography>
              <Slider
                value={parameters.temperature}
                onChange={(_, newValue) => setParameters(prev => ({ 
                  ...prev, 
                  temperature: newValue as number 
                }))}
                step={0.1}
                min={0}
                max={1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 1, label: '1' }
                ]}
              />
            </ParameterSlider>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleInference}
                disabled={loading || !input}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Running...' : 'Run Inference'}
              </Button>
              <Tooltip title="Reset">
                <IconButton onClick={handleReset} color="default">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={8}>
          <StyledPaper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Inference Result
              </Typography>
              {result && (
                <Tooltip title="Copy Result">
                  <IconButton onClick={handleCopyResult} size="small">
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            <CustomScrollbar
              sx={{
                flex: 1,
                minHeight: '60vh',
                backgroundColor: 'background.default',
                borderRadius: 1,
                p: 2
              }}
            >
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error" align="center">
                  {error}
                </Typography>
              ) : (
                <pre style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}>
                  {renderResult() || 'Run inference to see results'}
                </pre>
              )}
            </CustomScrollbar>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HuggingFacePlayground;
