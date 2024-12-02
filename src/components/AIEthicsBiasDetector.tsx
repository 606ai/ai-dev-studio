import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Alert
} from '@mui/material';
import { 
  Warning as WarningIcon, 
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';

interface BiasDetectionResult {
  category: string;
  detected: boolean;
  explanation: string;
}

export const AIEthicsBiasDetector: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [biasResults, setBiasResults] = useState<BiasDetectionResult[]>([]);

  const detectBiases = () => {
    const mockBiasDetection: BiasDetectionResult[] = [
      {
        category: 'Gender Bias',
        detected: inputText.toLowerCase().includes('he') && 
                  !inputText.toLowerCase().includes('she'),
        explanation: 'Potential gender imbalance in language usage'
      },
      {
        category: 'Racial Bias',
        detected: /\b(race|color)\b/i.test(inputText),
        explanation: 'Potential sensitive language around racial topics'
      },
      {
        category: 'Age Bias',
        detected: /\b(old|young)\b/i.test(inputText),
        explanation: 'Potential stereotyping based on age'
      }
    ];

    setBiasResults(mockBiasDetection);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        AI Ethics & Bias Detection
      </Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Input Text for Bias Analysis"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={detectBiases}
          disabled={!inputText}
        >
          Detect Biases
        </Button>

        {biasResults.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Bias Detection Results</Typography>
            <List>
              {biasResults.map((result, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {result.detected ? (
                      <WarningIcon color="error" />
                    ) : (
                      <CheckCircleIcon color="success" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.category}
                    secondary={result.explanation}
                  />
                </ListItem>
              ))}
            </List>
            {biasResults.some(r => r.detected) && (
              <Alert severity="warning">
                Potential bias detected. Review and revise your text.
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AIEthicsBiasDetector;
