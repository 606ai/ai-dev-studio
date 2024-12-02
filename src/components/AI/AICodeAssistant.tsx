import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Code,
  AutoFixHigh,
  Speed,
  Description,
  BugReport,
  Architecture,
  Psychology,
  Security,
  Clear
} from '@mui/icons-material';
import { useAICodeAssist } from '../../hooks/useAICodeAssist';
import { CodeContext, CodeSuggestion } from '../../services/AICodeAssistService';

interface AICodeAssistantProps {
  currentFile?: string;
  currentCode?: string;
  language?: string;
  cursorPosition?: { line: number; column: number };
  onApplySuggestion?: (suggestion: CodeSuggestion) => void;
}

const DEFAULT_MODEL_CONFIG = {
  model: 'codellama',
  baseUrl: 'http://localhost:11434',
  temperature: 0.7,
  maxTokens: 1000
};

export const AICodeAssistant: React.FC<AICodeAssistantProps> = ({
  currentFile,
  currentCode = '',
  language = 'typescript',
  cursorPosition,
  onApplySuggestion
}) => {
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<CodeSuggestion | null>(null);

  const {
    loading,
    error,
    suggestions,
    getCompletion,
    getRefactoringSuggestions,
    fixError,
    optimizeCode,
    generateDocs,
    reviewCode,
    clearSuggestions,
    clearError
  } = useAICodeAssist({
    modelConfig: DEFAULT_MODEL_CONFIG,
    onError: (error) => setSnackbarMessage(error.message)
  });

  const getContext = useCallback((): CodeContext => ({
    code: currentCode,
    language,
    cursor: cursorPosition,
    filePath: currentFile,
    projectContext: 'AI Dev Studio - Advanced IDE for AI-powered development'
  }), [currentCode, language, cursorPosition, currentFile]);

  const handleGetCompletion = async () => {
    const suggestion = await getCompletion(getContext());
    if (suggestion) setSelectedSuggestion(suggestion);
  };

  const handleGetRefactoring = async () => {
    const suggestion = await getRefactoringSuggestions(getContext());
    if (suggestion) setSelectedSuggestion(suggestion);
  };

  const handleOptimize = async () => {
    const suggestion = await optimizeCode(getContext());
    if (suggestion) setSelectedSuggestion(suggestion);
  };

  const handleGenerateDocs = async () => {
    const suggestion = await generateDocs(getContext());
    if (suggestion) setSelectedSuggestion(suggestion);
  };

  const handleReviewCode = async () => {
    const review = await reviewCode(getContext());
    if (review) {
      setSelectedSuggestion({
        code: '',
        explanation: [
          '## Code Review Results',
          '\n### Issues:',
          ...review.issues,
          '\n### Suggestions:',
          ...review.suggestions,
          '\n### Security Concerns:',
          ...review.securityConcerns
        ].join('\n'),
        confidence: 0.8,
        type: 'documentation'
      });
    }
  };

  const handleClearSuggestions = () => {
    clearSuggestions();
    setSelectedSuggestion(null);
  };

  const handleApplySuggestion = (suggestion: CodeSuggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
      setSnackbarMessage('Changes applied successfully!');
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          AI Code Assistant
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Get Code Completion">
            <IconButton onClick={handleGetCompletion} disabled={loading || !currentCode}>
              <Code />
            </IconButton>
          </Tooltip>
          <Tooltip title="Suggest Refactoring">
            <IconButton onClick={handleGetRefactoring} disabled={loading || !currentCode}>
              <AutoFixHigh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Optimize Code">
            <IconButton onClick={handleOptimize} disabled={loading || !currentCode}>
              <Speed />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generate Documentation">
            <IconButton onClick={handleGenerateDocs} disabled={loading || !currentCode}>
              <Description />
            </IconButton>
          </Tooltip>
          <Tooltip title="Review Code">
            <IconButton onClick={handleReviewCode} disabled={loading || !currentCode}>
              <Security />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear Suggestions">
            <IconButton onClick={handleClearSuggestions} disabled={loading}>
              <Clear />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {selectedSuggestion && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedSuggestion.type.charAt(0).toUpperCase() + selectedSuggestion.type.slice(1)} Suggestion
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {selectedSuggestion.explanation}
            </Typography>
            {selectedSuggestion.code && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Suggested Code:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    overflow: 'auto'
                  }}
                >
                  <code>{selectedSuggestion.code}</code>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Tooltip title="Apply Changes">
                    <IconButton
                      onClick={() => handleApplySuggestion(selectedSuggestion)}
                      color="primary"
                    >
                      <Psychology />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            )}
          </Paper>
        )}

        {suggestions.length > 0 && !selectedSuggestion && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {suggestions.map((suggestion, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{ p: 2, cursor: 'pointer' }}
                onClick={() => setSelectedSuggestion(suggestion)}
              >
                <Typography variant="subtitle2">
                  {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Suggestion
                </Typography>
                <Typography variant="body2" noWrap>
                  {suggestion.explanation.split('\n')[0]}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Paper>
  );
};

export default AICodeAssistant;
