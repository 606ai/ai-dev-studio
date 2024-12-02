import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Sync as SyncIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  CloudQueue as CloudIcon,
} from '@mui/icons-material';
import storageConfig from '../../config/storage';

interface SyncDirectory {
  path: string;
  enabled: boolean;
}

export const SyncSettings: React.FC = () => {
  const [syncEnabled, setSyncEnabled] = useState(storageConfig.syncEnabled);
  const [syncInterval, setSyncInterval] = useState(
    storageConfig.syncInterval.toString()
  );
  const [directories, setDirectories] = useState<SyncDirectory[]>([
    { path: '/src', enabled: true },
    { path: '/public', enabled: true },
    { path: '/scripts', enabled: true },
  ]);
  const [newDirectory, setNewDirectory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSyncToggle = () => {
    setSyncEnabled(!syncEnabled);
  };

  const handleIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSyncInterval(event.target.value);
  };

  const handleAddDirectory = () => {
    if (!newDirectory) return;

    if (directories.some((dir) => dir.path === newDirectory)) {
      setError('Directory already exists');
      return;
    }

    setDirectories([...directories, { path: newDirectory, enabled: true }]);
    setNewDirectory('');
    setError(null);
  };

  const handleRemoveDirectory = (path: string) => {
    setDirectories(directories.filter((dir) => dir.path !== path));
  };

  const handleDirectoryToggle = (path: string) => {
    setDirectories(
      directories.map((dir) =>
        dir.path === path ? { ...dir, enabled: !dir.enabled } : dir
      )
    );
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving sync settings:', {
      syncEnabled,
      syncInterval,
      directories,
    });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sync Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SyncIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Sync Configuration</Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={syncEnabled}
                onChange={handleSyncToggle}
                color="primary"
              />
            }
            label="Enable Auto-Sync"
          />

          <Box mt={2}>
            <TextField
              label="Sync Interval (seconds)"
              type="number"
              value={syncInterval}
              onChange={handleIntervalChange}
              disabled={!syncEnabled}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Cloud Providers
          </Typography>

          <List>
            {Object.entries(storageConfig.providers).map(([provider, config]) => (
              <ListItem key={provider}>
                <ListItemText
                  primary={provider.charAt(0).toUpperCase() + provider.slice(1)}
                  secondary={config.enabled ? 'Connected' : 'Not Connected'}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={config.enabled}
                    disabled={provider === 'firebase'} // Firebase is required
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FolderIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Synced Directories</Typography>
          </Box>

          <Box display="flex" mb={2}>
            <TextField
              label="Add Directory"
              value={newDirectory}
              onChange={(e) => setNewDirectory(e.target.value)}
              fullWidth
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleAddDirectory}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>

          <List>
            {directories.map((dir) => (
              <ListItem key={dir.path}>
                <ListItemText
                  primary={dir.path}
                  secondary={dir.enabled ? 'Syncing' : 'Not Syncing'}
                />
                <ListItemSecondaryAction>
                  <Tooltip title={dir.enabled ? 'Disable Sync' : 'Enable Sync'}>
                    <Switch
                      edge="end"
                      checked={dir.enabled}
                      onChange={() => handleDirectoryToggle(dir.path)}
                      sx={{ mr: 1 }}
                    />
                  </Tooltip>
                  <Tooltip title="Remove Directory">
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveDirectory(dir.path)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<CloudIcon />}
        >
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};
