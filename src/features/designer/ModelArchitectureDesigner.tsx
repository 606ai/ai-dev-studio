import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  Handle,
  Position,
} from 'reactflow';
import {
  Box,
  Paper,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LayersRounded,
  AddCircle,
  Settings,
  PlayArrow,
  Save,
  Code,
} from '@mui/icons-material';
import 'reactflow/dist/style.css';

const nodeTypes = {
  input: InputNode,
  conv2d: Conv2DNode,
  dense: DenseNode,
  dropout: DropoutNode,
  activation: ActivationNode,
  output: OutputNode,
};

function InputNode({ data }: any) {
  return (
    <Box
      sx={{
        padding: 2,
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle2">Input Layer</Typography>
      <Typography variant="caption" display="block">
        Shape: {data.shape.join(' × ')}
      </Typography>
      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
}

function Conv2DNode({ data }: any) {
  return (
    <Box
      sx={{
        padding: 2,
        border: '1px solid',
        borderColor: 'secondary.main',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Typography variant="subtitle2">Conv2D</Typography>
      <Typography variant="caption" display="block">
        Filters: {data.filters}
      </Typography>
      <Typography variant="caption" display="block">
        Kernel: {data.kernelSize.join(' × ')}
      </Typography>
      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
}

// Similar implementations for other node types...

const ModelArchitectureDesigner: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const addNewNode = (type: string) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 100 },
      data: getDefaultDataForType(type),
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultDataForType = (type: string) => {
    switch (type) {
      case 'input':
        return { shape: [224, 224, 3] };
      case 'conv2d':
        return { filters: 64, kernelSize: [3, 3], activation: 'relu' };
      case 'dense':
        return { units: 128, activation: 'relu' };
      case 'dropout':
        return { rate: 0.5 };
      case 'activation':
        return { function: 'relu' };
      case 'output':
        return { units: 10, activation: 'softmax' };
      default:
        return {};
    }
  };

  const generateCode = () => {
    // Generate Python/TensorFlow code from the model architecture
    const code = `
import tensorflow as tf

def create_model():
    model = tf.keras.Sequential([
        ${nodes
          .map((node) => {
            switch (node.type) {
              case 'input':
                return `tf.keras.layers.Input(shape=(${node.data.shape.join(
                  ','
                )}))`;
              case 'conv2d':
                return `tf.keras.layers.Conv2D(
                  filters=${node.data.filters},
                  kernel_size=${node.data.kernelSize},
                  activation='${node.data.activation}'
                )`;
              // Add cases for other layer types...
              default:
                return '';
            }
          })
          .join(',\n        ')}
    ])
    return model
    `;
    return code;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{ width: 240, flexShrink: 0 }}
      >
        <Box sx={{ width: 240, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Layer Palette
          </Typography>
          <List>
            {Object.keys(nodeTypes).map((type) => (
              <ListItem
                button
                key={type}
                onClick={() => addNewNode(type)}
              >
                <ListItemIcon>
                  <LayersRounded />
                </ListItemIcon>
                <ListItemText primary={type.charAt(0).toUpperCase() + type.slice(1)} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </Box>
      </Box>

      <Paper
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          p: 1,
          display: 'flex',
          gap: 1,
        }}
      >
        <Tooltip title="Generate Code">
          <IconButton onClick={() => {/* Show code dialog */}}>
            <Code />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save Model">
          <IconButton>
            <Save />
          </IconButton>
        </Tooltip>
        <Tooltip title="Train Model">
          <IconButton>
            <PlayArrow />
          </IconButton>
        </Tooltip>
      </Paper>

      <Dialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Layer Settings</DialogTitle>
        <DialogContent>
          {selectedNode && (
            <Box sx={{ pt: 2 }}>
              {/* Render different settings based on node type */}
              {/* This is just an example for Conv2D */}
              {selectedNode.type === 'conv2d' && (
                <>
                  <TextField
                    label="Filters"
                    type="number"
                    value={selectedNode.data.filters}
                    onChange={(e) => {
                      // Update node data
                    }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Activation</InputLabel>
                    <Select
                      value={selectedNode.data.activation}
                      onChange={(e) => {
                        // Update node data
                      }}
                    >
                      <MenuItem value="relu">ReLU</MenuItem>
                      <MenuItem value="sigmoid">Sigmoid</MenuItem>
                      <MenuItem value="tanh">Tanh</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setIsSettingsOpen(false)}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelArchitectureDesigner;
