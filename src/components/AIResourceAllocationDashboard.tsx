import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
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
  Memory as MemoryIcon, 
  Laptop as LaptopIcon, 
  Cloud as CloudIcon 
} from '@mui/icons-material';

interface ResourceAllocation {
  id: string;
  name: string;
  type: 'local' | 'cloud';
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
}

export const AIResourceAllocationDashboard: React.FC = () => {
  const [resources, setResources] = useState<ResourceAllocation[]>([
    {
      id: '1',
      name: 'Local Machine',
      type: 'local',
      cpuUsage: 65,
      memoryUsage: 78,
      storageUsage: 45
    },
    {
      id: '2',
      name: 'Cloud GPU Cluster',
      type: 'cloud',
      cpuUsage: 92,
      memoryUsage: 85,
      storageUsage: 60
    }
  ]);

  const getResourceIcon = (type: ResourceAllocation['type']) => {
    switch (type) {
      case 'local': return <LaptopIcon />;
      case 'cloud': return <CloudIcon />;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'success';
    if (usage < 80) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        AI Resource Allocation Dashboard
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
            <MemoryIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6">Resource Summary</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Chip 
                label={`Total Resources: ${resources.length}`} 
                color="default" 
                size="small" 
              />
              <Chip 
                label={`Local: ${resources.filter(r => r.type === 'local').length}`} 
                color="primary" 
                size="small" 
              />
              <Chip 
                label={`Cloud: ${resources.filter(r => r.type === 'cloud').length}`} 
                color="secondary" 
                size="small" 
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resource Utilization
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Resource</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>CPU Usage</TableCell>
                    <TableCell>Memory Usage</TableCell>
                    <TableCell>Storage Usage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getResourceIcon(resource.type)}
                          <Typography sx={{ ml: 1 }}>
                            {resource.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={resource.type} 
                          size="small" 
                          color={resource.type === 'local' ? 'primary' : 'secondary'} 
                        />
                      </TableCell>
                      <TableCell sx={{ width: '20%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={resource.cpuUsage} 
                          color={getUsageColor(resource.cpuUsage)} 
                        />
                        <Typography variant="caption">
                          {resource.cpuUsage}%
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '20%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={resource.memoryUsage} 
                          color={getUsageColor(resource.memoryUsage)} 
                        />
                        <Typography variant="caption">
                          {resource.memoryUsage}%
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '20%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={resource.storageUsage} 
                          color={getUsageColor(resource.storageUsage)} 
                        />
                        <Typography variant="caption">
                          {resource.storageUsage}%
                        </Typography>
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

export default AIResourceAllocationDashboard;
