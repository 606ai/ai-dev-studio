import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Chip,
  Rating,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from '@mui/material';
import {
  Search,
  FilterList,
  GetApp,
  Star,
  Share,
  Favorite,
  ShoppingCart,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelListing {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    rating: number;
  };
  price: number;
  rating: number;
  downloads: number;
  tags: string[];
  image: string;
  type: string;
  framework: string;
}

const ModelMarketplace: React.FC = () => {
  const [models, setModels] = useState<ModelListing[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelListing | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Simulate API call to fetch models
    const mockModels: ModelListing[] = [
      {
        id: '1',
        name: 'Advanced Image Classifier',
        description: 'State-of-the-art image classification model with 98% accuracy',
        author: {
          name: 'AI Research Lab',
          avatar: '/avatars/1.jpg',
          rating: 4.8,
        },
        price: 299,
        rating: 4.7,
        downloads: 1234,
        tags: ['computer-vision', 'classification', 'deep-learning'],
        image: '/models/classifier.jpg',
        type: 'Computer Vision',
        framework: 'TensorFlow',
      },
      // Add more mock models...
    ];
    setModels(mockModels);
  }, []);

  const ModelCard = ({ model }: { model: ModelListing }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="200"
          image={model.image}
          alt={model.name}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar src={model.author.avatar} sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2">{model.author.name}</Typography>
              <Rating value={model.author.rating} size="small" readOnly />
            </Box>
          </Box>

          <Typography gutterBottom variant="h5" component="div">
            {model.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {model.description}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {model.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating value={model.rating} size="small" readOnly />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({model.downloads} downloads)
            </Typography>
          </Box>
        </CardContent>

        <CardActions>
          <Button
            size="small"
            startIcon={<GetApp />}
            onClick={() => setSelectedModel(model)}
          >
            Download
          </Button>
          <Button size="small" startIcon={<Share />}>
            Share
          </Button>
          <Typography
            variant="h6"
            sx={{ ml: 'auto', color: 'primary.main' }}
          >
            ${model.price}
          </Typography>
        </CardActions>
      </Card>
    </motion.div>
  );

  const ModelDialog = () => (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      {selectedModel && (
        <>
          <DialogTitle>{selectedModel.name}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <img
                  src={selectedModel.image}
                  alt={selectedModel.name}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Specifications
                </Typography>
                <Typography variant="body2" paragraph>
                  Type: {selectedModel.type}
                </Typography>
                <Typography variant="body2" paragraph>
                  Framework: {selectedModel.framework}
                </Typography>
                <Typography variant="body2" paragraph>
                  Downloads: {selectedModel.downloads}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Price
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ${selectedModel.price}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => {
                // Handle purchase
                setDialogOpen(false);
              }}
            >
              Purchase
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Model Marketplace
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search models..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <FilterList />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {models.map((model) => (
          <Grid item key={model.id} xs={12} sm={6} md={4}>
            <ModelCard model={model} />
          </Grid>
        ))}
      </Grid>

      <ModelDialog />
    </Box>
  );
};

export default ModelMarketplace;
