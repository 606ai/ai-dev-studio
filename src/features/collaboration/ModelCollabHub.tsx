import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Avatar, Chip } from '@mui/material';
import { useSocket } from '../../hooks/useSocket';
import { useAppSelector } from '../../hooks/useAppStore';
import MonacoEditor from '@monaco-editor/react';
import { motion } from 'framer-motion';

interface CollaboratorStatus {
  id: string;
  username: string;
  avatar: string;
  cursor: { line: number; column: number };
  selection: { start: number; end: number };
  lastActive: Date;
}

const ModelCollabHub: React.FC = () => {
  const [collaborators, setCollaborators] = useState<CollaboratorStatus[]>([]);
  const [modelCode, setModelCode] = useState('');
  const socket = useSocket();
  const activeProject = useAppSelector(state => state.project.activeProject);

  useEffect(() => {
    if (!socket) return;

    socket.on('collaborator:update', (data: CollaboratorStatus[]) => {
      setCollaborators(data);
    });

    socket.on('model:change', (newCode: string) => {
      setModelCode(newCode);
    });

    return () => {
      socket.off('collaborator:update');
      socket.off('model:change');
    };
  }, [socket]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setModelCode(value);
    socket?.emit('model:change', value);
  };

  const handleCursorChange = (position: any) => {
    socket?.emit('cursor:move', {
      line: position.lineNumber,
      column: position.column,
    });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Real-time Collaboration Hub
        </Typography>
        <Grid container spacing={2} alignItems="center">
          {collaborators.map((collab) => (
            <Grid item key={collab.id}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Chip
                  avatar={<Avatar src={collab.avatar} />}
                  label={collab.username}
                  variant="outlined"
                  color="primary"
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <MonacoEditor
          height="100%"
          language="python"
          theme="vs-dark"
          value={modelCode}
          onChange={handleEditorChange}
          onCursorChange={handleCursorChange}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            automaticLayout: true,
          }}
        />
        
        {collaborators.map((collab) => (
          <motion.div
            key={collab.id}
            style={{
              position: 'absolute',
              left: `${collab.cursor.column * 8}px`,
              top: `${collab.cursor.line * 20}px`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              style={{
                width: 2,
                height: 20,
                backgroundColor: '#00ff00',
                position: 'relative',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: -20,
                  left: 4,
                  backgroundColor: '#00ff00',
                  padding: '0 4px',
                  borderRadius: 1,
                }}
              >
                {collab.username}
              </Typography>
            </div>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default ModelCollabHub;
