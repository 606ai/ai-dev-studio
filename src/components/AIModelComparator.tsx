import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow 
} from '@mui/material';

interface ModelMetrics {
  name: string;
  accuracy: number;
  speed: number;
  memoryUsage: number;
  complexity: number;
}

export const AIModelComparator: React.FC = () => {
  const [models] = useState<ModelMetrics[]>([
    {
      name: 'GPT-3.5',
      accuracy: 85.5,
      speed: 0.8,
      memoryUsage: 6.5,
      complexity: 7.2
    },
    {
      name: 'BERT Large',
      accuracy: 82.3,
      speed: 0.6,
      memoryUsage: 4.3,
      complexity: 6.5
    },
    {
      name: 'RoBERTa',
      accuracy: 88.1,
      speed: 0.7,
      memoryUsage: 5.1,
      complexity: 6.8
    }
  ]);

  const renderMetricChip = (value: number, highIsBetter: boolean = true) => {
    const color = highIsBetter 
      ? (value > 80 ? 'success' : value > 60 ? 'warning' : 'error')
      : (value < 60 ? 'success' : value < 80 ? 'warning' : 'error');
    
    return (
      <Chip 
        label={value.toFixed(1)} 
        color={color} 
        size="small" 
      />
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        AI Model Performance Comparator
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell align="right">Accuracy (%)</TableCell>
              <TableCell align="right">Speed (rel)</TableCell>
              <TableCell align="right">Memory Usage (GB)</TableCell>
              <TableCell align="right">Complexity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.name}>
                <TableCell component="th" scope="row">
                  {model.name}
                </TableCell>
                <TableCell align="right">
                  {renderMetricChip(model.accuracy)}
                </TableCell>
                <TableCell align="right">
                  {renderMetricChip(model.speed * 100, false)}
                </TableCell>
                <TableCell align="right">
                  {renderMetricChip(model.memoryUsage, false)}
                </TableCell>
                <TableCell align="right">
                  {renderMetricChip(model.complexity, false)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AIModelComparator;
