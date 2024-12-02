import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  LinearProgress, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Storage as StorageIcon, 
  DataUsage as DataUsageIcon 
} from '@mui/icons-material';

interface Dataset {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
}

export const AIDatasetManagement: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([
    {
      id: '1',
      name: 'ImageNet Subset',
      type: 'Image Classification',
      size: '5.2 GB',
      uploadProgress: 100,
      status: 'completed'
    },
    {
      id: '2',
      name: 'IMDB Reviews',
      type: 'Sentiment Analysis',
      size: '2.1 GB',
      uploadProgress: 75,
      status: 'uploading'
    }
  ]);

  const simulateDatasetUpload = () => {
    const newDataset: Dataset = {
      id: String(datasets.length + 1),
      name: 'Custom Dataset',
      type: 'Mixed',
      size: '1.5 GB',
      uploadProgress: 0,
      status: 'uploading'
    };

    setDatasets([...datasets, newDataset]);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setDatasets(prevDatasets => 
        prevDatasets.map(dataset => 
          dataset.id === newDataset.id && dataset.uploadProgress < 100
            ? { 
                ...dataset, 
                uploadProgress: Math.min(dataset.uploadProgress + 10, 100),
                status: dataset.uploadProgress >= 90 ? 'completed' : 'uploading'
              }
            : dataset
        )
      );
    }, 500);

    setTimeout(() => clearInterval(uploadInterval), 5000);
  };

  const getStatusColor = (status: Dataset['status']) => {
    switch (status) {
      case 'uploading': return 'primary';
      case 'completed': return 'success';
      case 'error': return 'error';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        AI Dataset Management
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
            <StorageIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6">Dataset Storage</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Size: 8.8 GB
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              sx={{ mt: 2 }}
              onClick={simulateDatasetUpload}
            >
              Upload Dataset
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Datasets</Typography>
              <Chip 
                icon={<DataUsageIcon />} 
                label={`${datasets.length} Datasets`} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell>{dataset.name}</TableCell>
                      <TableCell>{dataset.type}</TableCell>
                      <TableCell>{dataset.size}</TableCell>
                      <TableCell>
                        <Chip 
                          label={dataset.status} 
                          size="small" 
                          color={getStatusColor(dataset.status)} 
                        />
                      </TableCell>
                      <TableCell sx={{ width: '20%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={dataset.uploadProgress} 
                          color={getStatusColor(dataset.status)} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIDatasetManagement;
