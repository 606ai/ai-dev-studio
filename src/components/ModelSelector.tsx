import { FC, useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { OllamaModel, ollamaService } from '../services/ollamaService';

interface ModelSelectorProps {
  onModelSelect: (model: string) => void;
}

const ModelSelector: FC<ModelSelectorProps> = ({ onModelSelect }) => {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const modelList = await ollamaService.listModels();
      setModels(modelList);
      setError(null);
    } catch (err) {
      setError('Failed to fetch models. Make sure Ollama is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    onModelSelect(modelName);
  };

  const handlePullModel = async () => {
    if (!selectedModel) return;
    
    try {
      setLoading(true);
      await ollamaService.pullModel(selectedModel);
      await fetchModels();
      setError(null);
    } catch (err) {
      setError('Failed to pull model');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minWidth: 200, p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Model</InputLabel>
        <Select
          value={selectedModel}
          label="Model"
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={loading}
        >
          {models.map((model) => (
            <MenuItem key={model.name} value={model.name}>
              {model.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="contained"
        onClick={handlePullModel}
        disabled={!selectedModel || loading}
        startIcon={loading && <CircularProgress size={20} />}
      >
        Pull Model
      </Button>
    </Box>
  );
};

export default ModelSelector;
