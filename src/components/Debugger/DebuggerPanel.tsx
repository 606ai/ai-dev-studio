import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  StepOver,
  StepInto,
  StepOut,
  BugReport,
  Timeline,
  DeviceHub
} from '@mui/icons-material';
import { useDebugger } from '../../hooks/useDebugger';
import { DebugConfig, Variable, StackFrame } from '../../services/DebuggerService';

interface DebuggerPanelProps {
  filePath: string;
}

export const DebuggerPanel: React.FC<DebuggerPanelProps> = ({ filePath }) => {
  const {
    isDebugging,
    isProfiling,
    stackFrames,
    variables,
    error,
    startDebugSession,
    stopDebugSession,
    continue: continueExecution,
    pause,
    stepOver,
    stepInto,
    stepOut,
    evaluate,
    startProfiling,
    stopProfiling,
    scanForDevices,
    flashDevice
  } = useDebugger();

  const [expression, setExpression] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [devices, setDevices] = useState<string[]>([]);

  const handleStartDebugging = async () => {
    const config: DebugConfig = {
      type: 'node', // or 'python', 'cpp' based on file extension
      program: filePath,
      stopOnEntry: true
    };
    await startDebugSession(config);
  };

  const handleEvaluate = async () => {
    if (expression) {
      const result = await evaluate(expression);
      setEvaluationResult(JSON.stringify(result, null, 2));
    }
  };

  const handleScanDevices = async () => {
    const foundDevices = await scanForDevices();
    setDevices(foundDevices);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Debug Controls */}
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {!isDebugging ? (
          <Tooltip title="Start Debugging">
            <IconButton onClick={handleStartDebugging} color="primary">
              <BugReport />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Tooltip title="Stop Debugging">
              <IconButton onClick={stopDebugSession} color="error">
                <BugReport />
              </IconButton>
            </Tooltip>
            <Tooltip title="Continue">
              <IconButton onClick={continueExecution}>
                <PlayArrow />
              </IconButton>
            </Tooltip>
            <Tooltip title="Pause">
              <IconButton onClick={pause}>
                <Pause />
              </IconButton>
            </Tooltip>
            <Tooltip title="Step Over">
              <IconButton onClick={stepOver}>
                <StepOver />
              </IconButton>
            </Tooltip>
            <Tooltip title="Step Into">
              <IconButton onClick={stepInto}>
                <StepInto />
              </IconButton>
            </Tooltip>
            <Tooltip title="Step Out">
              <IconButton onClick={stepOut}>
                <StepOut />
              </IconButton>
            </Tooltip>
          </>
        )}
        
        <Divider orientation="vertical" flexItem />
        
        {!isProfiling ? (
          <Tooltip title="Start Profiling">
            <IconButton onClick={startProfiling} color="primary">
              <Timeline />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Stop Profiling">
            <IconButton onClick={stopProfiling} color="error">
              <Timeline />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="Scan Devices">
          <IconButton onClick={handleScanDevices}>
            <DeviceHub />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Debug Information */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Stack Frames */}
        <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Typography variant="subtitle2" sx={{ p: 1 }}>Call Stack</Typography>
          <List dense>
            {stackFrames.map((frame: StackFrame) => (
              <ListItem key={frame.id}>
                <ListItemText
                  primary={frame.name}
                  secondary={`${frame.source?.path}:${frame.line}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Variables */}
        <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Typography variant="subtitle2" sx={{ p: 1 }}>Variables</Typography>
          <List dense>
            {variables.map((variable: Variable) => (
              <ListItem key={variable.name}>
                <ListItemText
                  primary={variable.name}
                  secondary={`${variable.value} (${variable.type})`}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Evaluation */}
        <Box sx={{ flex: 1, p: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2">Evaluate Expression</Typography>
          <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEvaluate()}
            />
            <Button variant="contained" onClick={handleEvaluate}>
              Evaluate
            </Button>
          </Box>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={evaluationResult}
            variant="outlined"
            InputProps={{ readOnly: true }}
          />
        </Box>
      </Box>

      {/* Remote Devices */}
      {devices.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2">Remote Devices</Typography>
          <List dense>
            {devices.map((device) => (
              <ListItem key={device}>
                <ListItemText primary={device} />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSelectedDevice(device)}
                >
                  Connect
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Box sx={{ p: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{error.message}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default DebuggerPanel;
