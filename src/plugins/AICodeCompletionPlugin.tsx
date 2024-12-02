import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Paper, 
  Tooltip,
  SxProps,
  Theme,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  KeyboardArrowUp as UpIcon, 
  KeyboardArrowDown as DownIcon 
} from '@mui/icons-material';
import { ollamaService } from '@services/ollamaService';
import { huggingfaceService } from '@services/huggingfaceService';
import ScrollContainer from '@components/ScrollContainer';
import CustomScrollbar from '@components/CustomScrollbar';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { AI_MODELS, CODE_COMPLETION_CONFIG, ERROR_MESSAGES } from '@utils/constants';

interface CodeCompletionProps {
  currentCode: string;
  language: keyof typeof AI_MODELS.LANGUAGE_SUPPORT;
  sx?: SxProps<Theme>;
  onSuggestionSelect?: (suggestion: string) => void;
}

interface CodeSuggestion {
  id: string;
  content: string;
  source: string;
}

export const AICodeCompletionPlugin: React.FC<CodeCompletionProps> = ({ 
  currentCode, 
  language,
  sx,
  onSuggestionSelect
}) => {
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollUp = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: -200,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollDown = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: 200,
        behavior: 'smooth'
      });
    }
  }, []);

  const generateCodeSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const modelConfigs = [
        {
          service: ollamaService,
          model: AI_MODELS.CODE_COMPLETION.OLLAMA.CODELLAMA,
          method: 'generateResponse'
        },
        {
          service: huggingfaceService,
          model: AI_MODELS.CODE_COMPLETION.HUGGINGFACE.BIGCODE,
          method: 'inference'
        }
      ];

      const suggestionPromises = modelConfigs.map(async (config) => {
        try {
          let response;
          if (config.method === 'generateResponse') {
            response = await config.service.generateResponse({
              model: config.model,
              prompt: `Complete the following ${language} code:\n${currentCode}`,
              max_tokens: CODE_COMPLETION_CONFIG.MAX_TOKENS
            });
          } else {
            response = await config.service.inference({
              model: config.model,
              inputs: currentCode,
              parameters: { 
                max_new_tokens: CODE_COMPLETION_CONFIG.MAX_TOKENS,
                temperature: CODE_COMPLETION_CONFIG.TEMPERATURE
              }
            });
          }

          return {
            id: `${config.service.constructor.name}-${config.model}`,
            content: response.response || response[0]?.generated_text,
            source: config.model
          };
        } catch (modelError) {
          console.warn(`Model ${config.model} failed:`, modelError);
          return null;
        }
      });

      const results = await Promise.all(suggestionPromises);
      const validSuggestions = results.filter(Boolean) as CodeSuggestion[];

      if (validSuggestions.length === 0) {
        setError(ERROR_MESSAGES.NO_MODEL_AVAILABLE);
      }

      setSuggestions(validSuggestions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_CALL_FAILED;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCode, language]);

  useEffect(() => {
    if (currentCode.trim()) {
      generateCodeSuggestions();
    }
  }, [currentCode, language, generateCodeSuggestions]);

  const handleSuggestionCopy = (suggestion: string) => {
    navigator.clipboard.writeText(suggestion);
    onSuggestionSelect?.(suggestion);
  };

  return (
    <ErrorBoundary>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mt: 2, 
          height: '100%', 
          maxHeight: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
          position: 'relative',
          ...sx
        }}
      >
        <Typography variant="h6" gutterBottom>
          AI Code Suggestions
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box 
          sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            width: '100%',
            position: 'relative',
            pr: 1 
          }}
        >
          <CustomScrollbar
            sx={{
              height: '100%',
              width: '100%',
              backgroundColor: 'background.paper',
              borderRadius: 1
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Box p={2}>
                <Typography color="error">{error}</Typography>
              </Box>
            ) : (
              suggestions.map((suggestion, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {suggestion.content}
                  </pre>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}
                  >
                    <Chip 
                      label={`Suggestion from ${suggestion.source}`} 
                      size="small" 
                      color="primary" 
                      sx={{ mt: 1 }}
                    />
                    <Tooltip title="Click to copy">
                      <IconButton 
                        onClick={() => handleSuggestionCopy(suggestion.content)} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'background.paper',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <i className="fa fa-copy" aria-hidden="true"></i>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))
            )}
          </CustomScrollbar>
          
          {/* Scroll Navigation Buttons */}
          <Box 
            sx={{ 
              position: 'absolute', 
              right: 0, 
              top: '50%', 
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <IconButton 
              onClick={scrollUp} 
              size="small" 
              sx={{ 
                backgroundColor: 'background.paper',
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <UpIcon />
            </IconButton>
            <IconButton 
              onClick={scrollDown} 
              size="small" 
              sx={{ 
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <DownIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </ErrorBoundary>
  );
};

export default AICodeCompletionPlugin;
