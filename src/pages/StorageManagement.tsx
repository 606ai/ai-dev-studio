import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Backup as BackupIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { StorageStats } from '../components/StorageManager/StorageStats';
import { BackupManager } from '../components/StorageManager/BackupManager';
import { SyncSettings } from '../components/StorageManager/SyncSettings';

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const StorageManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, mt: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            color="inherit"
            href="/"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <StorageIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Storage Management
          </Typography>
        </Breadcrumbs>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="storage management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<StorageIcon />}
            label="Overview"
            id="storage-tab-0"
            aria-controls="storage-tabpanel-0"
          />
          <Tab
            icon={<BackupIcon />}
            label="Backups"
            id="storage-tab-1"
            aria-controls="storage-tabpanel-1"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Settings"
            id="storage-tab-2"
            aria-controls="storage-tabpanel-2"
          />
        </Tabs>

        <TabPanel value={selectedTab} index={0}>
          <StorageStats />
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <BackupManager />
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <SyncSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
};
