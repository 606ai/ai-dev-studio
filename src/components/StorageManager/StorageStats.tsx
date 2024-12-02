import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Backup as BackupIcon,
  FileCopy as FileIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useStorage } from '../../hooks/useStorage';

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  tooltip?: string;
}> = ({ icon, title, value, tooltip }) => (
  <Card>
    <Tooltip title={tooltip || ''}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          {icon}
          <Typography variant="h6" component="div" ml={1}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" color="primary">
          {value}
        </Typography>
      </CardContent>
    </Tooltip>
  </Card>
);

export const StorageStats: React.FC = () => {
  const { stats, loadStats, formatSize, isLoading } = useStorage();

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadStats]);

  if (!stats && !isLoading) {
    return null;
  }

  const usagePercentage = stats
    ? (stats.usedSize / stats.totalSize) * 100
    : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Storage Statistics
      </Typography>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<StorageIcon color="primary" />}
            title="Total Storage"
            value={stats ? formatSize(stats.totalSize) : '-'}
            tooltip="Total available storage space"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<SpeedIcon color={getUsageColor(usagePercentage) as any} />}
            title="Used Space"
            value={stats ? `${usagePercentage.toFixed(1)}%` : '-'}
            tooltip={`${stats ? formatSize(stats.usedSize) : '0'} used of ${
              stats ? formatSize(stats.totalSize) : '0'
            }`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<FileIcon color="primary" />}
            title="Files"
            value={stats ? stats.fileCount.toString() : '-'}
            tooltip="Total number of files"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<BackupIcon color="primary" />}
            title="Backups"
            value={stats ? stats.backupCount.toString() : '-'}
            tooltip="Total number of backups"
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Storage Usage
        </Typography>
        <LinearProgress
          variant="determinate"
          value={usagePercentage}
          color={getUsageColor(usagePercentage) as any}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="caption" color="text.secondary">
          {stats ? formatSize(stats.usedSize) : '0'} of{' '}
          {stats ? formatSize(stats.totalSize) : '0'} used
        </Typography>
      </Box>
    </Box>
  );
};
