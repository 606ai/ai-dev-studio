import React, { FC, useState, useEffect } from 'react';
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
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
} from '@mui/material';
import huggingfaceService, { HuggingFaceModel } from '../services/huggingfaceService';

const TASK_CATEGORIES = [
  'text-classification',
  'token-classification',
  'question-answering',
  'summarization',
  'translation',
  'text-generation',
  'fill-mask',
  'zero-shot-classification',
];

const HuggingFaceModelBrowser: FC = () => {
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(null);
  const [modelDetails, setModelDetails] = useState<any>(null);

  useEffect(() => {
    fetchTrendingModels();
  }, []);

  const fetchTrendingModels = async () => {
    setLoading(true);
    try {
      const trendingModels = await huggingfaceService.listTrendingModels();
      setModels(trendingModels);
    } catch (error) {
      console.error('Failed to fetch trending models', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchResults = await huggingfaceService.searchModels(
        searchQuery, 
        selectedTask || undefined
      );
      setModels(searchResults);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = async (model: HuggingFaceModel) => {
    setSelectedModel(model);
    setLoading(true);
    try {
      const details = await huggingfaceService.getModelDetails(model.modelId);
      setModelDetails(details);
    } catch (error) {
      console.error('Failed to fetch model details', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Hugging Face Model Browser
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search Models"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Task</InputLabel>
            <Select
              value={selectedTask}
              label="Filter by Task"
              onChange={(e) => setSelectedTask(e.target.value)}
            >
              <MenuItem value="">All Tasks</MenuItem>
              {TASK_CATEGORIES.map((task) => (
                <MenuItem key={task} value={task}>
                  {task.replace('-', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={selectedModel ? 8 : 12}>
            <Grid container spacing={2}>
              {models.map((model) => (
                <Grid item xs={12} sm={6} md={4} key={model.modelId}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      ...(selectedModel?.modelId === model.modelId 
                        ? { border: '2px solid primary.main' } 
                        : {})
                    }}
                    onClick={() => handleModelSelect(model)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" noWrap>
                        {model.name}
                      </Typography>
                      <Chip 
                        label={model.task} 
                        size="small" 
                        color="primary" 
                        sx={{ mb: 1 }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {model.description || 'No description available'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="caption">
                          Downloads: {model.downloads?.toLocaleString() || 'N/A'}
                        </Typography>
                        <Typography variant="caption">
                          Likes: {model.likes?.toLocaleString() || 'N/A'}
                        </Typography>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {selectedModel && (
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Model Details
                </Typography>
                {modelDetails ? (
                  <Box>
                    <Typography variant="subtitle1">
                      {modelDetails.modelId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {modelDetails.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption">Tags:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {modelDetails.tags?.map((tag: string) => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                      </Box>
                    </Box>
                    <Typography variant="body2">
                      License: {modelDetails.license || 'N/A'}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      href={`https://huggingface.co/${modelDetails.modelId}`}
                      target="_blank"
                      sx={{ mt: 2 }}
                    >
                      View on Hugging Face
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a model to view details
                  </Typography>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default HuggingFaceModelBrowser;
