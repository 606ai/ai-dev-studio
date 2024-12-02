import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add,
  Delete,
  Refresh,
  PlayArrow,
  Stop,
  Download,
  Upload,
  Settings,
  Update
} from '@mui/icons-material';
import { useEnvironment } from '../../hooks/useEnvironment';

interface EnvironmentManagerProps {
  onEnvironmentChange?: (environment: any) => void;
}

export const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({
  onEnvironmentChange
}) => {
  const {
    environments,
    activeEnvironment,
    loading,
    error,
    createEnvironment,
    activateEnvironment,
    installPackages,
    uninstallPackages,
    updatePackages,
    exportEnvironment,
    refreshEnvironments
  } = useEnvironment({
    onError: (error) => {
      console.error(error);
    }
  });

  const [selectedEnv, setSelectedEnv] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [newEnvData, setNewEnvData] = useState({
    name: '',
    type: 'conda' as const,
    python_version: '3.9',
    packages: [] as string[]
  });
  const [packageInput, setPackageInput] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const handleCreateEnvironment = async () => {
    try {
      const env = await createEnvironment(
        newEnvData.name,
        newEnvData.type,
        newEnvData.python_version,
        newEnvData.packages
      );
      if (env) {
        setCreateDialogOpen(false);
        setNewEnvData({
          name: '',
          type: 'conda',
          python_version: '3.9',
          packages: []
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivateEnvironment = async (env: any) => {
    try {
      await activateEnvironment(env.id);
      if (onEnvironmentChange) {
        onEnvironmentChange(env);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstallPackages = async () => {
    if (!selectedEnv || selectedPackages.length === 0) return;

    try {
      await installPackages(selectedEnv.id, selectedPackages);
      setPackageDialogOpen(false);
      setSelectedPackages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUninstallPackages = async (packages: string[]) => {
    if (!selectedEnv) return;

    try {
      await uninstallPackages(selectedEnv.id, packages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePackages = async (packages: string[]) => {
    if (!selectedEnv) return;

    try {
      await updatePackages(selectedEnv.id, packages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportEnvironment = async (format: 'requirements.txt' | 'environment.yml') => {
    if (!selectedEnv) return;

    try {
      const path = await exportEnvironment(selectedEnv.id, format);
      if (path) {
        // Handle successful export (e.g., trigger download)
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="Environments" />
          <Tab label="Packages" disabled={!selectedEnv} />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activeTab === 0 && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Grid container spacing={2}>
            {environments.map(env => (
              <Grid item xs={12} md={6} lg={4} key={env.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {env.name}
                      {env.isActive && (
                        <Chip
                          label="Active"
                          color="primary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {env.type} • Python {env.python_version}
                    </Typography>
                    <Typography variant="body2">
                      {env.packages.length} packages installed
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={env.isActive ? <Stop /> : <PlayArrow />}
                      onClick={() => handleActivateEnvironment(env)}
                    >
                      {env.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Settings />}
                      onClick={() => {
                        setSelectedEnv(env);
                        setActiveTab(1);
                      }}
                    >
                      Manage
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Create Environment
          </Button>
        </Box>
      )}

      {activeTab === 1 && selectedEnv && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Packages in {selectedEnv.name}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setPackageDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              Install Packages
            </Button>
            <Button
              variant="outlined"
              startIcon={<Update />}
              onClick={() => handleUpdatePackages(selectedEnv.packages.map(p => p.name))}
            >
              Update All
            </Button>
          </Box>

          <List>
            {selectedEnv.packages.map((pkg: any) => (
              <ListItem key={pkg.name}>
                <ListItemText
                  primary={pkg.name}
                  secondary={`${pkg.installed_version || pkg.version}${
                    pkg.latest_version ? ` (Latest: ${pkg.latest_version})` : ''
                  }`}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Update Package">
                    <IconButton
                      edge="end"
                      onClick={() => handleUpdatePackages([pkg.name])}
                    >
                      <Update />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Uninstall Package">
                    <IconButton
                      edge="end"
                      onClick={() => handleUninstallPackages([pkg.name])}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Create Environment Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Environment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Environment Name"
            value={newEnvData.name}
            onChange={e => setNewEnvData({ ...newEnvData, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Environment Type</InputLabel>
            <Select
              value={newEnvData.type}
              onChange={e => setNewEnvData({ ...newEnvData, type: e.target.value as any })}
            >
              <MenuItem value="conda">Conda</MenuItem>
              <MenuItem value="virtualenv">Virtualenv</MenuItem>
              <MenuItem value="poetry">Poetry</MenuItem>
              <MenuItem value="pipenv">Pipenv</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Python Version</InputLabel>
            <Select
              value={newEnvData.python_version}
              onChange={e => setNewEnvData({ ...newEnvData, python_version: e.target.value as string })}
            >
              <MenuItem value="3.7">Python 3.7</MenuItem>
              <MenuItem value="3.8">Python 3.8</MenuItem>
              <MenuItem value="3.9">Python 3.9</MenuItem>
              <MenuItem value="3.10">Python 3.10</MenuItem>
              <MenuItem value="3.11">Python 3.11</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateEnvironment}
            disabled={!newEnvData.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Install Packages Dialog */}
      <Dialog
        open={packageDialogOpen}
        onClose={() => setPackageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Install Packages</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Package Name"
            value={packageInput}
            onChange={e => setPackageInput(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter' && packageInput) {
                setSelectedPackages([...selectedPackages, packageInput]);
                setPackageInput('');
              }
            }}
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedPackages.map(pkg => (
              <Chip
                key={pkg}
                label={pkg}
                onDelete={() => setSelectedPackages(selectedPackages.filter(p => p !== pkg))}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPackageDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInstallPackages}
            disabled={selectedPackages.length === 0}
          >
            Install
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default EnvironmentManager;
