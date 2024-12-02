import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  FolderSpecial,
  History,
  Storage,
  Refresh,
  Settings,
  Timeline,
} from '@mui/icons-material';
import { useStorage } from '../../hooks/useStorage';
import { formatBytes } from '../../utils/format';

interface StorageItem {
  id: string;
  name: string;
  size: number;
  lastModified: Date;
  type: string;
}

export const StorageManager: React.FC = () => {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ used: 0, total: 1 });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'analytics'>('list');
  
  const { getStorageItems, moveItems, deleteItems, getStorageQuota } = useStorage();

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const quota = await getStorageQuota();
      setUsage(quota);
      const storageItems = await getStorageItems();
      setItems(storageItems);
    } catch (error) {
      console.error('Failed to fetch storage data:', error);
    }
    setLoading(false);
  };

  const handleMove = async (destination: string) => {
    try {
      await moveItems(selectedItems, destination);
      refreshData();
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to move items:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItems(selectedItems);
      refreshData();
      setSelectedItems([]);
      setOpenDialog(false);
    } catch (error) {
      console.error('Failed to delete items:', error);
    }
  };

  const getStorageAnalytics = () => {
    const analytics = {
      byType: {} as Record<string, number>,
      largeFiles: items.filter(item => item.size > 100 * 1024 * 1024),
      oldFiles: items.filter(item => {
        const monthsOld = (new Date().getTime() - item.lastModified.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsOld > 6;
      }),
    };

    items.forEach(item => {
      analytics.byType[item.type] = (analytics.byType[item.type] || 0) + item.size;
    });

    return analytics;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" component="h2">
                  Storage Management
                </Typography>
                <Box>
                  <Tooltip title="Refresh">
                    <IconButton onClick={refreshData} disabled={loading}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Settings">
                    <IconButton>
                      <Settings />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={activeView === 'list' ? <Timeline /> : <Storage />}
                    onClick={() => setActiveView(activeView === 'list' ? 'analytics' : 'list')}
                  >
                    {activeView === 'list' ? 'Show Analytics' : 'Show Files'}
                  </Button>
                </Box>
              </Box>

              <Box mb={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Storage Usage: {formatBytes(usage.used)} of {formatBytes(usage.total)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(usage.used / usage.total) * 100}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>

              {activeView === 'list' ? (
                <List>
                  {items.map((item) => (
                    <ListItem
                      key={item.id}
                      selected={selectedItems.includes(item.id)}
                      onClick={() => {
                        setSelectedItems(prev =>
                          prev.includes(item.id)
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                    >
                      <ListItemText
                        primary={item.name}
                        secondary={`${formatBytes(item.size)} • Last modified: ${item.lastModified.toLocaleDateString()}`}
                      />
                      <Chip label={item.type} size="small" sx={{ mr: 1 }} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box>
                  <Typography variant="h6" gutterBottom>Storage Analytics</Typography>
                  {Object.entries(getStorageAnalytics().byType).map(([type, size]) => (
                    <Box key={type} mb={2}>
                      <Typography variant="body2" gutterBottom>
                        {type}: {formatBytes(size)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(size / usage.total) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {selectedItems.length > 0 && (
                <Box mt={2} display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FolderSpecial />}
                    onClick={() => handleMove('/Archive')}
                  >
                    Move to Archive
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setOpenDialog(true)}
                  >
                    Delete Selected
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {selectedItems.length} selected items?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
