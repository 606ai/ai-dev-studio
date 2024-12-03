import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import {
  MoreVert,
  Refresh,
  Download,
  Share,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface MetricData {
  timestamp: string;
  accuracy: number;
  loss: number;
  latency: number;
  memory: number;
  requests: number;
}

const ModelAnalyticsDashboard: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [metrics, setMetrics] = useState<MetricData[]>([]);

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    // Simulate API call
    const mockData = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      accuracy: 0.90 + Math.random() * 0.05,
      loss: 0.15 + Math.random() * 0.05,
      latency: 100 + Math.random() * 50,
      memory: 500 + Math.random() * 100,
      requests: Math.floor(1000 + Math.random() * 500),
    }));

    setMetrics(mockData.reverse());
  };

  const MetricCard = ({ title, value, change, color }: any) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: change >= 0 ? 'success.main' : 'error.main' }}
          >
            {change >= 0 ? '+' : ''}{change}%
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Model Analytics</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchMetrics}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            {timeRange}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {['1h', '24h', '7d', '30d'].map((range) => (
              <MenuItem
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setAnchorEl(null);
                }}
              >
                {range}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Model Accuracy"
            value="95.2%"
            change={2.1}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Average Latency"
            value="142ms"
            change={-5.3}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Memory Usage"
            value="512MB"
            change={1.8}
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Requests/min"
            value="1,243"
            change={12.5}
            color="success"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <ResponsiveContainer>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#8884d8"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Resource Usage
            </Typography>
            <ResponsiveContainer>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Request Distribution
            </Typography>
            <ResponsiveContainer height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelAnalyticsDashboard;
