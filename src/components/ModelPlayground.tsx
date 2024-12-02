import React, { FC, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { ollamaService, OllamaModel } from '../services/ollamaService';
import CustomScrollbar from '../components/CustomScrollbar'; // Import CustomScrollbar component
import CircularProgress from '@mui/material/CircularProgress'; // Import CircularProgress component

interface ModelPlaygroundProps {
  selectedModel?: string;
}

const ModelPlayground: FC<ModelPlaygroundProps> = ({ selectedModel }) => {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [currentModel, setCurrentModel] = useState(selectedModel || '');
  const [tabValue, setTabValue] = useState(0);
  
  // Generation Parameters
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(200);
  const [topP, setTopP] = useState(0.9);
  const [repeatPenalty, setRepeatPenalty] = useState(1.1);

  // Advanced Settings
  const [systemPrompt, setSystemPrompt] = useState('');
  const [useStreaming, setUseStreaming] = useState(false);

  // Results
  const [generationResult, setGenerationResult] = useState('');
  const [embeddingResult, setEmbeddingResult] = useState<number[]>([]);
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const availableModels = await ollamaService.listModels();
        setModels(availableModels);
        if (!currentModel && availableModels.length > 0) {
          setCurrentModel(availableModels[0].name);
        }
      } catch (error) {
        console.error('Failed to fetch models', error);
      }
    };

    fetchModels();
  }, []);

  const handleGenerate = async () => {
    if (!currentModel) return;

    try {
      setLoading(true); // Set loading state to true
      const response = await ollamaService.generateResponse({
        model: currentModel,
        prompt,
        system: systemPrompt,
        stream: useStreaming,
      });
      setGenerationResult(response.response);
      setLoading(false); // Set loading state to false
    } catch (error) {
      console.error('Generation failed', error);
      setLoading(false); // Set loading state to false
    }
  };

  const handleGenerateEmbedding = async () => {
    if (!currentModel) return;

    try {
      setLoading(true); // Set loading state to true
      const response = await ollamaService.generateEmbeddings(currentModel, prompt);
      setEmbeddingResult(response.embedding);
      setLoading(false); // Set loading state to false
    } catch (error) {
      console.error('Embedding generation failed', error);
      setLoading(false); // Set loading state to false
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Ollama Model Playground
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Model</InputLabel>
              <Select
                value={currentModel}
                label="Select Model"
                onChange={(e) => setCurrentModel(e.target.value)}
              >
                {models.map((model) => (
                  <MenuItem key={model.name} value={model.name}>
                    {model.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tabs 
              value={tabValue} 
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="Text Generation" />
              <Tab label="Embeddings" />
            </Tabs>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              sx={{ mb: 2 }}
            />

            {tabValue === 0 && (
              <>
                <TextField
                  fullWidth
                  label="System Prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Temperature</Typography>
                  <Slider
                    value={temperature}
                    onChange={(_, newValue) => setTemperature(newValue as number)}
                    step={0.1}
                    min={0}
                    max={1}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Max Tokens</Typography>
                  <Slider
                    value={maxTokens}
                    onChange={(_, newValue) => setMaxTokens(newValue as number)}
                    step={50}
                    min={50}
                    max={1000}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={useStreaming}
                      onChange={(e) => setUseStreaming(e.target.checked)}
                    />
                  }
                  label="Use Streaming"
                />

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleGenerate}
                  sx={{ mt: 2 }}
                >
                  Generate
                </Button>
              </>
            )}

            {tabValue === 1 && (
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                onClick={handleGenerateEmbedding}
                sx={{ mt: 2 }}
              >
                Generate Embedding
              </Button>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {tabValue === 0 ? 'Generation Result' : 'Embedding Result'}
            </Typography>
            {tabValue === 0 && (
              <CustomScrollbar
                sx={{
                  height: 'calc(100vh - 200px)',
                  width: '100%',
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  p: 2
                }}
              >
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {generationResult || 'Generation results will appear here'}
                  </pre>
                )}
              </CustomScrollbar>
            )}
            {tabValue === 1 && (
              <CustomScrollbar
                sx={{
                  height: 'calc(100vh - 200px)',
                  width: '100%',
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  p: 2
                }}
              >
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {embeddingResult 
                      ? `Embedding Vector (${embeddingResult.length} dimensions): 
                        ${embeddingResult.slice(0, 10).join(', ')}...`
                      : 'Embedding results will appear here'}
                  </pre>
                )}
              </CustomScrollbar>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelPlayground;
