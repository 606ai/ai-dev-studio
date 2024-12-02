import React, { FC, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { 
  Download, 
  Delete, 
  Info, 
  Add, 
  CloudDownload 
} from '@mui/icons-material';

import { ollamaService, OllamaModel } from '../services/ollamaService';

const ModelManager: FC = () => {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [pullModelDialogOpen, setPullModelDialogOpen] = useState(false);
  const [createModelDialogOpen, setCreateModelDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<OllamaModel | null>(null);
  const [newModelName, setNewModelName] = useState('');
  const [newModelUrl, setNewModelUrl] = useState('');
  const [newModelFile, setNewModelFile] = useState('');

  const fetchModels = async () => {
    try {
      setLoading(true);
      const modelList = await ollamaService.listModels();
      setModels(modelList);
    } catch (error) {
      console.error('Failed to fetch models', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handlePullModel = async () => {
    try {
      setLoading(true);
      await ollamaService.pullModel(newModelName);
      await fetchModels();
      setPullModelDialogOpen(false);
    } catch (error) {
      console.error('Failed to pull model', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async () => {
    try {
      setLoading(true);
      await ollamaService.createModel({
        name: newModelName,
        modelfile: newModelFile
      });
      await fetchModels();
      setCreateModelDialogOpen(false);
    } catch (error) {
      console.error('Failed to create model', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    try {
      setLoading(true);
      await ollamaService.deleteModel(modelName);
      await fetchModels();
    } catch (error) {
      console.error('Failed to delete model', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModelDetails = async (model: OllamaModel) => {
    try {
      const details = await ollamaService.showModelInfo(model.name);
      setSelectedModel(details);
    } catch (error) {
      console.error('Failed to fetch model details', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Ollama Model Management</Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<CloudDownload />}
            onClick={() => setPullModelDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Pull Model
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<Add />}
            onClick={() => setCreateModelDialogOpen(true)}
          >
            Create Model
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Modified</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.name}>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>{formatBytes(model.size)}</TableCell>
                  <TableCell>{new Date(model.modified_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Tooltip title="Model Details">
                      <Button 
                        size="small" 
                        color="primary" 
                        onClick={() => handleViewModelDetails(model)}
                      >
                        <Info />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Delete Model">
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteModel(model.name)}
                      >
                        <Delete />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pull Model Dialog */}
      <Dialog 
        open={pullModelDialogOpen} 
        onClose={() => setPullModelDialogOpen(false)}
      >
        <DialogTitle>Pull Ollama Model</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Model Name"
            fullWidth
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            placeholder="e.g. llama2, mistral, etc."
          />
          <TextField
            margin="dense"
            label="Model URL (Optional)"
            fullWidth
            value={newModelUrl}
            onChange={(e) => setNewModelUrl(e.target.value)}
            placeholder="Custom model repository URL"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPullModelDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePullModel} 
            color="primary" 
            disabled={!newModelName}
          >
            Pull Model
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Model Dialog */}
      <Dialog 
        open={createModelDialogOpen} 
        onClose={() => setCreateModelDialogOpen(false)}
      >
        <DialogTitle>Create Custom Ollama Model</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Model Name"
            fullWidth
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            placeholder="Name for your custom model"
          />
          <TextField
            margin="dense"
            label="Modelfile Content"
            fullWidth
            multiline
            rows={4}
            value={newModelFile}
            onChange={(e) => setNewModelFile(e.target.value)}
            placeholder="FROM base_model\nPARAMETER param_name param_value\n..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModelDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateModel} 
            color="primary" 
            disabled={!newModelName || !newModelFile}
          >
            Create Model
          </Button>
        </DialogActions>
      </Dialog>

      {/* Model Details Dialog */}
      {selectedModel && (
        <Dialog 
          open={!!selectedModel} 
          onClose={() => setSelectedModel(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Model Details: {selectedModel.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {selectedModel.details && Object.entries(selectedModel.details).map(([key, value]) => (
                <Chip 
                  key={key} 
                  label={`${key}: ${value}`} 
                  variant="outlined" 
                  color="primary" 
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedModel(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ModelManager;
