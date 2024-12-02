import React, { FC, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import { ollamaService } from '../services/ollamaService';

const PROMPT_TEMPLATES = {
  'code-generation': 'Generate a {language} function that {description}',
  'problem-solving': 'Solve the following problem step by step: {problem}',
  'explanation': 'Explain {topic} in a way that a {audience} would understand',
  'creative-writing': 'Write a {genre} about {subject} with the following characteristics: {details}',
};

const PromptEngineer: FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [promptVariables, setPromptVariables] = useState<{[key: string]: string}>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    const variables = template.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || [];
    const newVariables: {[key: string]: string} = {};
    variables.forEach(v => newVariables[v] = '');
    setPromptVariables(newVariables);
    setGeneratedPrompt('');
  };

  const handleVariableChange = (key: string, value: string) => {
    setPromptVariables(prev => ({ ...prev, [key]: value }));
  };

  const generatePrompt = () => {
    let template = PROMPT_TEMPLATES[selectedTemplate as keyof typeof PROMPT_TEMPLATES];
    Object.entries(promptVariables).forEach(([key, value]) => {
      template = template.replace(`{${key}}`, value);
    });
    setGeneratedPrompt(template);
  };

  const generateAIResponse = async () => {
    if (!selectedModel || !generatedPrompt) return;

    try {
      const response = await ollamaService.generateResponse({
        model: selectedModel,
        prompt: generatedPrompt,
      });
      setAiResponse(response.response);
    } catch (error) {
      console.error('Failed to generate response', error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Prompt Engineering Studio
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Prompt Template</InputLabel>
          <Select
            value={selectedTemplate}
            label="Prompt Template"
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            {Object.keys(PROMPT_TEMPLATES).map((template) => (
              <MenuItem key={template} value={template}>
                {template.replace('-', ' ').toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {Object.entries(promptVariables).map(([key, value]) => (
          <TextField
            key={key}
            fullWidth
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            value={value}
            onChange={(e) => handleVariableChange(key, e.target.value)}
            sx={{ mb: 2 }}
          />
        ))}

        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={generatePrompt}
            disabled={!selectedTemplate}
          >
            Generate Prompt
          </Button>
        </Stack>
      </Paper>

      {generatedPrompt && (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Generated Prompt
          </Typography>
          <Box sx={{ 
            backgroundColor: 'background.default', 
            p: 2, 
            borderRadius: 1,
            mb: 2
          }}>
            <Typography variant="body2">{generatedPrompt}</Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Model</InputLabel>
            <Select
              value={selectedModel}
              label="Select Model"
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <MenuItem value="llama2">Llama 2</MenuItem>
              <MenuItem value="mistral">Mistral</MenuItem>
              {/* Add more models dynamically */}
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            color="secondary" 
            onClick={generateAIResponse}
            disabled={!selectedModel}
          >
            Generate AI Response
          </Button>
        </Paper>
      )}

      {aiResponse && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            AI Response
          </Typography>
          <Box sx={{ 
            backgroundColor: 'background.default', 
            p: 2, 
            borderRadius: 1 
          }}>
            <Typography variant="body2">{aiResponse}</Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default PromptEngineer;
