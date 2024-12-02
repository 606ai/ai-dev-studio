import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { StorageHealth, StorageAnalytics } from '../../types/storage';
import { monitoringService } from '../../services/monitoring';
import { formatBytes, formatDate } from '../../utils/format';

interface MetricCard {
  title: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
}

export const MonitoringDashboard: React.FC = () => {
  const theme = useTheme();
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [analytics, setAnalytics] = useState<StorageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [healthData, analyticsData] = await Promise.all([
        monitoringService.checkStorageHealth(),
        monitoringService.getAnalytics('day'),
      ]);
      setHealth(healthData);
      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return theme.palette.success.main;
      case 'degraded':
        return theme.palette.warning.main;
      case 'unhealthy':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const metrics: MetricCard[] = analytics
    ? [
        {
          title: 'Storage Usage',
          value: formatBytes(analytics.usage.current),
          trend: analytics.usage.trend,
          color: theme.palette.primary.main,
        },
        {
          title: 'Files Processed',
          value: analytics.metrics.uploads + analytics.metrics.downloads,
          trend: 0,
          color: theme.palette.secondary.main,
        },
        {
          title: 'Sync Status',
          value: `${analytics.metrics.syncs} syncs`,
          color: theme.palette.info.main,
        },
        {
          title: 'Error Rate',
          value: `${((analytics.metrics.errors / 
            (analytics.metrics.uploads + analytics.metrics.downloads)) * 
            100).toFixed(2)}%`,
          color: theme.palette.error.main,
        },
      ]
    : [];

  const pieData = analytics
    ? [
        { name: 'Uploads', value: analytics.metrics.uploads },
        { name: 'Downloads', value: analytics.metrics.downloads },
        { name: 'Syncs', value: analytics.metrics.syncs },
        { name: 'Errors', value: analytics.metrics.errors },
      ]
    : [];

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.info.main,
    theme.palette.error.main,
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Storage Monitoring</Typography>
        <IconButton onClick={fetchData} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Health Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {health && getHealthIcon(health.status)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  System Health: {health?.status.toUpperCase()}
                </Typography>
              </Box>
              {health?.issues.map((issue, index) => (
                <Alert
                  key={index}
                  severity={
                    issue.includes('Critical')
                      ? 'error'
                      : issue.includes('Warning')
                      ? 'warning'
                      : 'info'
                  }
                  sx={{ mb: 1 }}
                >
                  {issue}
                </Alert>
              ))}
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {metrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      {metric.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: metric.color }}
                    >
                      {metric.value}
                    </Typography>
                    {metric.trend !== undefined && (
                      <Typography
                        variant="body2"
                        color={metric.trend >= 0 ? 'success.main' : 'error.main'}
                      >
                        {metric.trend >= 0 ? '+' : ''}
                        {metric.trend}%
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Storage Usage Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        {
                          name: 'Previous',
                          value: analytics?.usage.average || 0,
                        },
                        {
                          name: 'Current',
                          value: analytics?.usage.current || 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={theme.palette.primary.main}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Operation Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Performance Metrics */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Upload Speed
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(analytics?.performance.uploadSpeed || 0)}/s
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Download Speed
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(analytics?.performance.downloadSpeed || 0)}/s
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Sync Latency
                  </Typography>
                  <Typography variant="h6">
                    {analytics?.performance.syncLatency.toFixed(2)}ms
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Backup Duration
                  </Typography>
                  <Typography variant="h6">
                    {(analytics?.performance.backupDuration || 0) / 1000}s
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};
