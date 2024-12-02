import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  Refresh,
  Add,
  Delete,
  Settings,
  Timeline,
  Map,
  Air
} from '@mui/icons-material';
import useDataVisualization from '../../hooks/useDataVisualization';
import {
  DataPoint,
  GpsPoint,
  WindData,
  SensorData,
  ChartOptions
} from '../../services/DataVisualizationService';

interface DashboardPanel {
  id: string;
  type: 'timeseries' | 'gps' | 'windrose' | 'sensor';
  title: string;
  data: any[];
  options: ChartOptions;
}

export const DataDashboard: React.FC = () => {
  const {
    isReady,
    createTimeSeriesChart,
    createGpsTrackMap,
    createWindRose,
    analyzeSensorData,
    exportToCSV
  } = useDataVisualization();

  const [panels, setPanels] = useState<DashboardPanel[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const panelRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  useEffect(() => {
    // Initialize dashboard with default panels if needed
    if (isReady && panels.length === 0) {
      setPanels([
        {
          id: 'wind-speed',
          type: 'timeseries',
          title: 'Wind Speed Over Time',
          data: [],
          options: {
            type: 'line',
            title: 'Wind Speed',
            xAxis: { label: 'Time', type: 'time' },
            yAxis: { label: 'Speed (knots)', type: 'linear' },
            color: '#2196f3'
          }
        },
        {
          id: 'gps-track',
          type: 'gps',
          title: 'GPS Track',
          data: [],
          options: {
            type: 'map',
            title: 'Session Track',
            color: '#f44336'
          }
        },
        {
          id: 'wind-rose',
          type: 'windrose',
          title: 'Wind Direction Distribution',
          data: [],
          options: {
            type: 'heatmap',
            title: 'Wind Rose',
            color: '#4caf50'
          }
        }
      ]);
    }
  }, [isReady]);

  useEffect(() => {
    // Update charts when panels or data changes
    panels.forEach(panel => {
      const container = panelRefs.current[panel.id];
      if (!container || panel.data.length === 0) return;

      switch (panel.type) {
        case 'timeseries':
          createTimeSeriesChart(panel.data as DataPoint[], panel.options, container);
          break;
        case 'gps':
          createGpsTrackMap(panel.data as GpsPoint[], panel.options, container);
          break;
        case 'windrose':
          createWindRose(panel.data as WindData[], panel.options, container);
          break;
      }
    });
  }, [panels, createTimeSeriesChart, createGpsTrackMap, createWindRose]);

  const handleAddPanel = () => {
    const newPanel: DashboardPanel = {
      id: `panel-${Date.now()}`,
      type: 'timeseries',
      title: 'New Panel',
      data: [],
      options: {
        type: 'line',
        title: 'New Chart',
        xAxis: { label: 'X', type: 'linear' },
        yAxis: { label: 'Y', type: 'linear' },
        color: '#9c27b0'
      }
    };
    setPanels([...panels, newPanel]);
  };

  const handleRemovePanel = (id: string) => {
    setPanels(panels.filter(panel => panel.id !== id));
  };

  const handleExport = (panel: DashboardPanel) => {
    exportToCSV(panel.data, `${panel.title.toLowerCase().replace(/\s+/g, '-')}.csv`);
  };

  const handleDatasetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedDataset(event.target.value as string);
    // Here you would typically load the selected dataset
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Data Visualization Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Dataset</InputLabel>
            <Select
              value={selectedDataset}
              onChange={handleDatasetChange}
              label="Dataset"
            >
              <MenuItem value="wind-data">Wind Data</MenuItem>
              <MenuItem value="gps-tracks">GPS Tracks</MenuItem>
              <MenuItem value="sensor-readings">Sensor Readings</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddPanel}
          >
            Add Panel
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {panels.map(panel => (
          <Grid item xs={12} md={6} lg={4} key={panel.id}>
            <Paper
              sx={{
                p: 2,
                height: 400,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">{panel.title}</Typography>
                <Box>
                  <Tooltip title="Export Data">
                    <IconButton size="small" onClick={() => handleExport(panel)}>
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh">
                    <IconButton size="small">
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Settings">
                    <IconButton size="small">
                      <Settings />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove Panel">
                    <IconButton
                      size="small"
                      onClick={() => handleRemovePanel(panel.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Box
                ref={el => {
                  if (el) panelRefs.current[panel.id] = el;
                }}
                sx={{ flex: 1 }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DataDashboard;
