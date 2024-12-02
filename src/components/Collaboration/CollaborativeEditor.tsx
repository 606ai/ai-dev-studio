import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  IconButton,
  Drawer,
  Divider,
  Badge,
  Tooltip,
  Button
} from '@mui/material';
import {
  Send,
  People,
  Chat,
  VideoCall,
  Share,
  ContentCopy,
  PersonAdd
} from '@mui/icons-material';
import { AdvancedEditor } from '../CodeEditor/AdvancedEditor';
import { User, Message } from '../../services/CollaborationService';
import useCollaboration from '../../hooks/useCollaboration';

interface CollaborativeEditorProps {
  roomId: string;
  currentUser: User;
  serverUrl: string;
  openAIKey: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  roomId,
  currentUser,
  serverUrl,
  openAIKey
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    connectedUsers,
    messages,
    joinRoom,
    leaveRoom,
    sendMessage,
    bindEditor
  } = useCollaboration(serverUrl, currentUser);

  useEffect(() => {
    joinRoom(roomId);
    setInviteLink(`${window.location.origin}/join/${roomId}`);

    return () => {
      leaveRoom();
    };
  }, [roomId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
  };

  const handleEditorMount = (editor: any) => {
    bindEditor(editor);
  };

  const renderUserCursor = (user: User) => {
    if (!user.cursor) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: `${user.cursor.column * 8}px`,
          top: `${user.cursor.line * 20}px`,
          width: '2px',
          height: '18px',
          backgroundColor: user.color,
          pointerEvents: 'none'
        }}
      />
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {/* Main Editor */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge
            color="success"
            variant="dot"
            invisible={!isConnected}
          >
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              Collaborative Session
            </Typography>
          </Badge>

          <Tooltip title="Copy Invite Link">
            <Button
              size="small"
              startIcon={<ContentCopy />}
              onClick={handleCopyInviteLink}
            >
              Share
            </Button>
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Show Users">
            <IconButton onClick={() => setUsersOpen(true)}>
              <Badge
                badgeContent={connectedUsers.length}
                color="primary"
              >
                <People />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Chat">
            <IconButton onClick={() => setChatOpen(true)}>
              <Badge
                badgeContent={messages.filter(m => !m.read).length}
                color="primary"
              >
                <Chat />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Video Call">
            <IconButton>
              <VideoCall />
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Editor */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <AdvancedEditor
            openAIKey={openAIKey}
            onChange={() => {}}
            onMount={handleEditorMount}
          />
          {connectedUsers.map(user => renderUserCursor(user))}
        </Box>
      </Box>

      {/* Users Drawer */}
      <Drawer
        anchor="right"
        open={usersOpen}
        onClose={() => setUsersOpen(false)}
        PaperProps={{
          sx: { width: 300 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Connected Users</Typography>
          <List>
            {connectedUsers.map(user => (
              <ListItem key={user.id}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: user.color
                    }}
                  >
                    {user.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={user.id === currentUser.id ? '(You)' : ''}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        PaperProps={{
          sx: { width: 300 }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Chat</Typography>
          </Box>
          <Divider />
          <Box
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            {messages.map(message => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.userId === currentUser.id ? 'flex-end' : 'flex-start'
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {message.userName}
                </Typography>
                <Paper
                  sx={{
                    p: 1,
                    bgcolor: message.userId === currentUser.id ? 'primary.main' : 'background.paper',
                    color: message.userId === currentUser.id ? 'primary.contrastText' : 'text.primary'
                  }}
                >
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
              </Grid>
              <Grid item>
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default CollaborativeEditor;
