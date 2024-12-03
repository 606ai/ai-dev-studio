import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Refresh,
  Timeline,
  Assessment,
  Memory,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import * as d3 from 'd3';

interface MetricPoint {
  timestamp: number;
  loss: number;
  accuracy: number;
  gradientNorm: number;
  layerActivations: number[];
  memoryUsage: number;
  throughput: number;
}

const ModelPerformanceViz: React.FC = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('loss');
  const [timeWindow, setTimeWindow] = useState(300); // 5 minutes
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isTraining) {
      const interval = setInterval(() => {
        // Simulate real-time metrics
        const newMetric: MetricPoint = {
          timestamp: Date.now(),
          loss: Math.random() * 0.5,
          accuracy: 0.85 + Math.random() * 0.1,
          gradientNorm: Math.random() * 2,
          layerActivations: Array(10)
            .fill(0)
            .map(() => Math.random()),
          memoryUsage: 2000 + Math.random() * 1000,
          throughput: 100 + Math.random() * 50,
        };

        setMetrics((prev) => [...prev.slice(-100), newMetric]);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isTraining]);

  useEffect(() => {
    if (!svgRef.current || metrics.length === 0) return;

    // D3.js visualization for layer activations
    const svg = d3.select(svgRef.current);
    const width = 400;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const x = d3
      .scaleLinear()
      .domain([0, metrics[0].layerActivations.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<number>()
      .x((d, i) => x(i))
      .y((d) => y(d));

    svg.selectAll('*').remove();

    svg
      .append('path')
      .datum(metrics[metrics.length - 1].layerActivations)
      .attr('fill', 'none')
      .attr('stroke', '#8884d8')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
  }, [metrics]);

  const MetricCard = ({ title, value, unit, icon }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4">
          {typeof value === 'number' ? value.toFixed(4) : value}
          {unit && (
            <Typography variant="caption" sx={{ ml: 1 }}>
              {unit}
            </Typography>
          )}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Model Performance</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Tooltip title={isTraining ? 'Pause Training' : 'Resume Training'}>
            <IconButton onClick={() => setIsTraining(!isTraining)}>
              {isTraining ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Metrics">
            <IconButton onClick={() => setMetrics([])}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Loss"
            value={metrics[metrics.length - 1]?.loss ?? 0}
            icon={<Timeline color="primary" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Accuracy"
            value={(metrics[metrics.length - 1]?.accuracy ?? 0) * 100}
            unit="%"
            icon={<Assessment color="success" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Memory Usage"
            value={(metrics[metrics.length - 1]?.memoryUsage ?? 0) / 1000}
            unit="GB"
            icon={<Memory color="warning" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Throughput"
            value={metrics[metrics.length - 1]?.throughput ?? 0}
            unit="samples/sec"
            icon={<Speed color="info" />}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Training Progress</Typography>
              <FormControl sx={{ ml: 'auto', minWidth: 120 }}>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  size="small"
                >
                  <MenuItem value="loss">Loss</MenuItem>
                  <MenuItem value="accuracy">Accuracy</MenuItem>
                  <MenuItem value="gradientNorm">Gradient Norm</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis />
                <RechartsTooltip
                  formatter={(value: number) => value.toFixed(4)}
                  labelFormatter={(label: number) =>
                    new Date(label).toLocaleTimeString()
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#8884d8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Layer Activations
            </Typography>
            <svg
              ref={svgRef}
              width="100%"
              height="300"
              viewBox="0 0 400 300"
              preserveAspectRatio="xMidYMid meet"
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resource Usage
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="memoryUsage"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="throughput"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelPerformanceViz;
