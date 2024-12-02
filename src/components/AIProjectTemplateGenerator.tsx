import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Select, 
  MenuItem, 
  Button, 
  FormControl, 
  InputLabel 
} from '@mui/material';

interface ProjectTemplate {
  name: string;
  description: string;
  technologies: string[];
  boilerplateCode: string;
}

export const AIProjectTemplateGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedProject, setGeneratedProject] = useState<ProjectTemplate | null>(null);

  const projectTemplates: ProjectTemplate[] = [
    {
      name: 'Image Classification',
      description: 'Deep learning project for image recognition',
      technologies: ['TensorFlow', 'Keras', 'OpenCV'],
      boilerplateCode: `
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing import image

class ImageClassifier:
    def __init__(self, model_path):
        self.model = ResNet50(weights='imagenet')
    
    def predict(self, img_path):
        img = image.load_img(img_path, target_size=(224, 224))
        return self.model.predict(img)
      `
    },
    {
      name: 'Natural Language Processing',
      description: 'Sentiment analysis and text processing',
      technologies: ['Hugging Face', 'NLTK', 'SpaCy'],
      boilerplateCode: `
from transformers import pipeline

class SentimentAnalyzer:
    def __init__(self):
        self.classifier = pipeline('sentiment-analysis')
    
    def analyze(self, text):
        return self.classifier(text)
      `
    }
  ];

  const generateProjectTemplate = () => {
    const template = projectTemplates.find(t => t.name === selectedTemplate);
    setGeneratedProject(template || null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        AI Project Template Generator
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Project Type</InputLabel>
              <Select
                value={selectedTemplate}
                label="Project Type"
                onChange={(e) => setSelectedTemplate(e.target.value as string)}
              >
                {projectTemplates.map(template => (
                  <MenuItem key={template.name} value={template.name}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={generateProjectTemplate}
              sx={{ mt: 2 }}
              disabled={!selectedTemplate}
            >
              Generate Template
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          {generatedProject && (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">{generatedProject.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {generatedProject.description}
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Technologies:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {generatedProject.technologies.map(tech => (
                  <Box 
                    key={tech} 
                    sx={{ 
                      backgroundColor: 'primary.light', 
                      color: 'primary.contrastText',
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1 
                    }}
                  >
                    {tech}
                  </Box>
                ))}
              </Box>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Boilerplate Code:
              </Typography>
              <pre style={{ 
                backgroundColor: '#f4f4f4', 
                padding: '10px', 
                borderRadius: '5px',
                overflowX: 'auto'
              }}>
                {generatedProject.boilerplateCode}
              </pre>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIProjectTemplateGenerator;
