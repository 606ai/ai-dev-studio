import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Delete as DeleteIcon,
  CloudDownload as DownloadIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useStorage } from '../../hooks/useStorage';

export const BackupManager: React.FC = () => {
  const {
    backups,
    loadBackups,
    backup,
    cleanup,
    formatSize,
    isLoading,
    error,
  } = useStorage();

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: () => {},
  });

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(event.target.files);
    }
  };

  const handleBackup = async () => {
    if (!selectedFiles) return;

    try {
      await backup(Array.from(selectedFiles));
      setSelectedFiles(null);
      loadBackups(); // Refresh the list
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const handleCleanup = () => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Cleanup',
      content: 'This will remove old backups. Are you sure?',
      action: async () => {
        try {
          await cleanup();
          loadBackups(); // Refresh the list
        } catch (error) {
          console.error('Cleanup failed:', error);
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const calculateBackupSize = (files: any[]) => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Backup Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="backup-file-input"
            />
            <label htmlFor="backup-file-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<BackupIcon />}
                sx={{ mr: 2 }}
              >
                Select Files
              </Button>
            </label>
            <Button
              variant="contained"
              onClick={handleBackup}
              disabled={!selectedFiles}
              startIcon={<CloudDownload />}
              sx={{ mr: 2 }}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCleanup}
              startIcon={<DeleteIcon />}
            >
              Cleanup Old Backups
            </Button>
          </Box>

          {selectedFiles && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files:
              </Typography>
              <List dense>
                {Array.from(selectedFiles).map((file, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={file.name}
                      secondary={formatSize(file.size)}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Typography variant="h6" gutterBottom>
        Backup History
      </Typography>

      <List>
        {backups.map((backup, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ScheduleIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  {new Date(backup.timestamp).toLocaleString()}
                </Typography>
                <Chip
                  label={`${backup.files.length} files`}
                  size="small"
                  sx={{ ml: 2 }}
                />
                <Chip
                  label={formatSize(calculateBackupSize(backup.files))}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>

              <List dense>
                {backup.files.map((file, fileIndex) => (
                  <ListItem key={fileIndex}>
                    <ListItemText
                      primary={file.name}
                      secondary={formatSize(file.size)}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Download">
                        <IconButton
                          edge="end"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}
      </List>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>{confirmDialog.content}</DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
          >
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
