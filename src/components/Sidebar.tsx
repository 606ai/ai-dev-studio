import { FC } from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, styled } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CodeIcon from '@mui/icons-material/Code';
import BugReportIcon from '@mui/icons-material/BugReport';
import SettingsIcon from '@mui/icons-material/Settings';

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 240,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
}));

const Sidebar: FC = () => {
  return (
    <SidebarContainer>
      <List>
        <ListItem button>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary="Explorer" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <CodeIcon />
          </ListItemIcon>
          <ListItemText primary="Code" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <BugReportIcon />
          </ListItemIcon>
          <ListItemText primary="Debug" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </SidebarContainer>
  );
};

export default Sidebar;
