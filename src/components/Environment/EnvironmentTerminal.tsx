import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Clear,
  ContentCopy,
  Download,
  Settings,
  Add,
  Close
} from '@mui/icons-material';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface EnvironmentTerminalProps {
  environmentPath?: string;
  pythonPath?: string;
  onCommand?: (command: string) => void;
  onExit?: () => void;
}

export const EnvironmentTerminal: React.FC<EnvironmentTerminalProps> = ({
  environmentPath,
  pythonPath,
  onCommand,
  onExit
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selection: '#264f78',
          black: '#1e1e1e',
          red: '#f44747',
          green: '#6a9955',
          yellow: '#d7ba7d',
          blue: '#569cd6',
          magenta: '#c586c0',
          cyan: '#4dc9b0',
          white: '#d4d4d4',
          brightBlack: '#808080',
          brightRed: '#f44747',
          brightGreen: '#6a9955',
          brightYellow: '#d7ba7d',
          brightBlue: '#569cd6',
          brightMagenta: '#c586c0',
          brightCyan: '#4dc9b0',
          brightWhite: '#d4d4d4'
        }
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      term.writeln('AI Dev Studio Environment Terminal');
      term.writeln('Type "help" for available commands');
      term.write('\r\n$ ');

      term.onKey(({ key, domEvent }) => {
        const ev = domEvent;
        const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

        if (ev.keyCode === 13) { // Enter
          const command = currentCommand.trim();
          if (command) {
            term.write('\r\n');
            executeCommand(command);
            setCommandHistory([...commandHistory, command]);
            setHistoryIndex(-1);
            setCurrentCommand('');
          }
          term.write('\r\n$ ');
        } else if (ev.keyCode === 8) { // Backspace
          if (currentCommand.length > 0) {
            term.write('\b \b');
            setCurrentCommand(currentCommand.slice(0, -1));
          }
        } else if (ev.keyCode === 38) { // Up arrow
          if (historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            const command = commandHistory[commandHistory.length - 1 - newIndex];
            clearCurrentLine(term);
            term.write(command);
            setHistoryIndex(newIndex);
            setCurrentCommand(command);
          }
        } else if (ev.keyCode === 40) { // Down arrow
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const command = commandHistory[commandHistory.length - 1 - newIndex];
            clearCurrentLine(term);
            term.write(command);
            setHistoryIndex(newIndex);
            setCurrentCommand(command);
          } else if (historyIndex === 0) {
            clearCurrentLine(term);
            setHistoryIndex(-1);
            setCurrentCommand('');
          }
        } else if (printable) {
          term.write(key);
          setCurrentCommand(currentCommand + key);
        }
      });

      setTerminal(term);

      const handleResize = () => {
        fitAddon.fit();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        term.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [terminalRef.current]);

  const clearCurrentLine = (term: Terminal) => {
    term.write('\r$ ');
    for (let i = 0; i < currentCommand.length; i++) {
      term.write(' ');
    }
    term.write('\r$ ');
  };

  const executeCommand = async (command: string) => {
    if (!terminal) return;

    if (onCommand) {
      onCommand(command);
    }

    switch (command.toLowerCase()) {
      case 'clear':
        terminal.clear();
        break;

      case 'help':
        terminal.writeln('Available commands:');
        terminal.writeln('  clear      - Clear terminal');
        terminal.writeln('  help       - Show this help message');
        terminal.writeln('  python     - Start Python REPL');
        terminal.writeln('  pip        - Package management');
        terminal.writeln('  conda      - Conda environment management');
        terminal.writeln('  exit       - Close terminal');
        break;

      case 'python':
        if (pythonPath) {
          terminal.writeln('Starting Python REPL...');
          // Implementation would connect to a Python process
        } else {
          terminal.writeln('Python path not configured');
        }
        break;

      case 'exit':
        if (onExit) {
          onExit();
        }
        break;

      default:
        if (command.startsWith('pip ') || command.startsWith('conda ')) {
          terminal.writeln(`Executing: ${command}`);
          // Implementation would execute package management commands
        } else {
          terminal.writeln(`Command not found: ${command}`);
        }
    }
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleClearTerminal = () => {
    if (terminal) {
      terminal.clear();
    }
    handleMenuClose();
  };

  const handleCopyToClipboard = () => {
    if (terminal) {
      const selection = terminal.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    }
    handleMenuClose();
  };

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Terminal {environmentPath ? `(${environmentPath})` : ''}
        </Typography>
        <Tooltip title="Settings">
          <IconButton size="small" onClick={handleSettingsClick}>
            <Settings fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear">
          <IconButton size="small" onClick={handleClearTerminal}>
            <Clear fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onExit}>
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        ref={terminalRef}
        sx={{
          flex: 1,
          bgcolor: 'background.paper',
          '& .xterm': {
            padding: 1
          }
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyToClipboard}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClearTerminal}>
          <ListItemIcon>
            <Clear fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clear</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default EnvironmentTerminal;
