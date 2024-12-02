import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import {
  Code,
  FormatPaint,
  Settings,
  CloudDownload,
  CloudUpload,
  Add,
  Search,
  BugReport,
  SmartToy,
  Palette,
  Language
} from '@mui/icons-material';
import useCodeEditor from '../../hooks/useCodeEditor';
import { CodeSnippet } from '../../services/CodeEditorService';

interface AdvancedEditorProps {
  openAIKey: string;
  initialLanguage?: string;
  initialValue?: string;
  theme?: string;
  onChange?: (value: string) => void;
  onError?: (errors: any[]) => void;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  openAIKey,
  initialLanguage = 'python',
  initialValue = '',
  theme = 'vs-dark',
  onChange,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);

  const {
    isReady,
    createEditor,
    setValue,
    getValue,
    setLanguage,
    insertSnippet,
    getSnippets,
    formatCode,
    setTheme,
    onDidChangeModelContent,
    getModelMarkers,
    editor
  } = useCodeEditor(openAIKey, {
    theme,
    enableAI: true,
    maxSuggestions: 5
  });

  useEffect(() => {
    if (isReady && containerRef.current && !editor) {
      const newEditor = createEditor(containerRef.current, {
        value: initialValue,
        language: selectedLanguage
      });

      // Set up change handler
      onDidChangeModelContent((e) => {
        if (onChange) {
          onChange(getValue());
        }

        // Check for errors
        const markers = getModelMarkers();
        if (onError) {
          onError(markers);
        }
      });
    }
  }, [isReady, containerRef.current]);

  useEffect(() => {
    if (isReady) {
      const languageSnippets = getSnippets(selectedLanguage);
      setSnippets(languageSnippets);
    }
  }, [isReady, selectedLanguage]);

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newLanguage = event.target.value as string;
    setSelectedLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  const handleSnippetSelect = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
    setSnippetDialogOpen(true);
  };

  const handleInsertSnippet = () => {
    if (selectedSnippet) {
      insertSnippet(selectedSnippet);
      setSnippetDialogOpen(false);
      setSelectedSnippet(null);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFormat = () => {
    formatCode();
    handleMenuClose();
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    handleMenuClose();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={0}>
        <Toolbar variant="dense">
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              label="Language"
            >
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="r">R</MenuItem>
              <MenuItem value="julia">Julia</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Insert Snippet">
            <IconButton onClick={() => setSnippetDialogOpen(true)}>
              <Add />
            </IconButton>
          </Tooltip>

          <Tooltip title="Format Code">
            <IconButton onClick={handleFormat}>
              <FormatPaint />
            </IconButton>
          </Tooltip>

          <Tooltip title="AI Suggestions">
            <IconButton>
              <SmartToy />
            </IconButton>
          </Tooltip>

          <Tooltip title="Find">
            <IconButton>
              <Search />
            </IconButton>
          </Tooltip>

          <Tooltip title="Debug">
            <IconButton>
              <BugReport />
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title="Settings">
            <IconButton onClick={handleMenuOpen}>
              <Settings />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Paper>

      <Box ref={containerRef} sx={{ flex: 1 }} />

      {/* Settings Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleThemeChange('vs-dark')}>
          <ListItemIcon>
            <Palette />
          </ListItemIcon>
          <ListItemText primary="Dark Theme" />
        </MenuItem>
        <MenuItem onClick={() => handleThemeChange('vs-light')}>
          <ListItemIcon>
            <Palette />
          </ListItemIcon>
          <ListItemText primary="Light Theme" />
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <Language />
          </ListItemIcon>
          <ListItemText primary="Language Settings" />
        </MenuItem>
      </Menu>

      {/* Snippet Dialog */}
      <Dialog
        open={snippetDialogOpen}
        onClose={() => setSnippetDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Insert Code Snippet</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            {snippets.map((snippet) => (
              <Box
                key={snippet.name}
                sx={{
                  p: 2,
                  mb: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleSnippetSelect(snippet)}
              >
                <Typography variant="subtitle1">{snippet.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {snippet.description}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {snippet.tags.map((tag) => (
                    <Typography
                      key={tag}
                      component="span"
                      variant="caption"
                      sx={{
                        mr: 1,
                        px: 1,
                        py: 0.5,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: 1
                      }}
                    >
                      {tag}
                    </Typography>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnippetDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleInsertSnippet}
            variant="contained"
            disabled={!selectedSnippet}
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedEditor;
