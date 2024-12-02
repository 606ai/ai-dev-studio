import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Avatar, 
  AvatarGroup,
  Chip
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Edit as EditIcon 
} from '@mui/icons-material';

interface Collaborator {
  id: string;
  name: string;
  color: string;
  currentAction: string;
}

export const RealTimeCollaborationWorkspace: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'Alice',
      color: '#FF6B6B',
      currentAction: 'Editing model configuration'
    },
    {
      id: '2',
      name: 'Bob',
      color: '#4ECDC4',
      currentAction: 'Reviewing code'
    }
  ]);

  const [activeCollaborators, setActiveCollaborators] = useState(0);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setActiveCollaborators(Math.floor(Math.random() * 5));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Real-Time Collaboration Workspace
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              height: '300px', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Active Workspace</Typography>
              <Chip 
                icon={<PersonIcon />} 
                label={`${activeCollaborators} Active`} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
            <Box 
              sx={{ 
                flexGrow: 1, 
                border: '1px dashed', 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Typography color="text.secondary">
                Collaborative Editing Space
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Collaborators</Typography>
              <AvatarGroup max={4}>
                {collaborators.map((collab) => (
                  <Avatar 
                    key={collab.id} 
                    sx={{ 
                      bgcolor: collab.color, 
                      width: 32, 
                      height: 32 
                    }}
                  >
                    {collab.name[0]}
                  </Avatar>
                ))}
              </AvatarGroup>
            </Box>
            {collaborators.map((collab) => (
              <Box 
                key={collab.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1 
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: collab.color, 
                    width: 24, 
                    height: 24, 
                    mr: 2 
                  }}
                >
                  {collab.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2">{collab.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EditIcon 
                      sx={{ 
                        fontSize: 'small', 
                        color: 'text.secondary', 
                        mr: 1 
                      }} 
                    />
                    <Typography variant="caption" color="text.secondary">
                      {collab.currentAction}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeCollaborationWorkspace;
