import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Backup as BackupIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';

interface StorageStats {
  totalSize: number;
  usedSize: number;
  largeFiles: Array<{ name: string; size: number }>;
  unusedFiles: Array<{ name: string; lastAccessed: Date }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`storage-tabpanel-${index}`}
      aria-labelledby={`storage-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const StorageManager: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: () => {},
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/storage/analyze');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Failed to analyze storage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Backup',
      content: 'Are you sure you want to backup all files to cloud storage?',
      action: async () => {
        setIsLoading(true);
        try {
          await fetch('/api/storage/backup', { method: 'POST' });
          // Show success message
        } catch (err) {
          setError('Backup failed');
        } finally {
          setIsLoading(false);
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  const handleCleanup = async () => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Cleanup',
      content: 'This will remove unused and temporary files. Continue?',
      action: async () => {
        setIsLoading(true);
        try {
          await fetch('/api/storage/cleanup', { method: 'POST' });
          handleAnalyze(); // Refresh stats
        } catch (err) {
          setError('Cleanup failed');
        } finally {
          setIsLoading(false);
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/storage/sync', { method: 'POST' });
      // Show success message
    } catch (err) {
      setError('Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Storage Manager
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<StorageIcon />}
          onClick={handleAnalyze}
          sx={{ mr: 1 }}
        >
          Analyze
        </Button>
        <Button
          variant="contained"
          startIcon={<BackupIcon />}
          onClick={handleBackup}
          sx={{ mr: 1 }}
        >
          Backup
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DeleteIcon />}
          onClick={handleCleanup}
          sx={{ mr: 1 }}
        >
          Cleanup
        </Button>
        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          onClick={handleSync}
        >
          Sync
        </Button>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {stats && (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              <Tab label="Overview" />
              <Tab label="Large Files" />
              <Tab label="Unused Files" />
            </Tabs>
          </Box>

          <TabPanel value={selectedTab} index={0}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(stats.usedSize / stats.totalSize) * 100}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography>
                  Used: {formatSize(stats.usedSize)} of {formatSize(stats.totalSize)}
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            <List>
              {stats.largeFiles.map((file, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={file.name}
                    secondary={`Size: ${formatSize(file.size)}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={selectedTab} index={2}>
            <List>
              {stats.unusedFiles.map((file, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={file.name}
                    secondary={`Last accessed: ${file.lastAccessed.toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </TabPanel>
        </Box>
      )}

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>{confirmDialog.content}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={() => confirmDialog.action()} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
