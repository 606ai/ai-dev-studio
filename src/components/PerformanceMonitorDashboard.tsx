import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  LinearProgress 
} from '@mui/material';
import { 
  Memory as MemoryIcon, 
  Laptop as LaptopIcon, 
  Storage as StorageIcon 
} from '@mui/icons-material';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

export const PerformanceMonitorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0
  });

  const fetchSystemMetrics = async () => {
    try {
      // Simulated metrics - in real implementation, use system monitoring API
      const mockMetrics: SystemMetrics = {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        networkLatency: Math.random() * 500
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Metrics fetch failed', error);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(fetchSystemMetrics, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const MetricCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
  }> = ({ icon, label, value, color }) => (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {icon}
      <Typography variant="h6" sx={{ mt: 1 }}>
        {label}
      </Typography>
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={value} 
          color="primary"
          sx={{ 
            height: 10,
            borderRadius: 5,
            backgroundColor: `${color}20`,
            '& .MuiLinearProgress-bar': {
              backgroundColor: color
            }
          }}
        />
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          {value.toFixed(2)}%
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Typography variant="h5" gutterBottom>
        System Performance Monitor
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            icon={<LaptopIcon fontSize="large" color="primary" />}
            label="CPU Usage"
            value={metrics.cpuUsage}
            color="#3f51b5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            icon={<MemoryIcon fontSize="large" color="secondary" />}
            label="Memory Usage"
            value={metrics.memoryUsage}
            color="#f50057"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            icon={<StorageIcon fontSize="large" color="success" />}
            label="Disk Usage"
            value={metrics.diskUsage}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Typography variant="h6">Network Latency</Typography>
            <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
              {metrics.networkLatency.toFixed(2)} ms
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMonitorDashboard;
