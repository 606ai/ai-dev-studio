import { Router } from 'express';
import { z } from 'zod';
import ModelService from '../services/models/ModelService';
import { validateRequest } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const modelService = ModelService.getInstance();

// Schema for model creation and update
const modelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  framework: z.string(),
  repository: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Create a new model
router.post(
  '/',
  authenticate,
  authorize(['admin', 'developer']),
  validateRequest({ body: modelSchema }),
  async (req, res) => {
    try {
      const model = await modelService.createModel(req.body);
      res.status(201).json(model);
    } catch (error) {
      logger.error('Failed to create model:', error);
      res.status(500).json({ error: 'Failed to create model' });
    }
  }
);

// Get a model by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const model = await modelService.getModel(req.params.id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.json(model);
  } catch (error) {
    logger.error('Failed to get model:', error);
    res.status(500).json({ error: 'Failed to get model' });
  }
});

// List all models
router.get('/', authenticate, async (req, res) => {
  try {
    const models = await modelService.listModels();
    res.json(models);
  } catch (error) {
    logger.error('Failed to list models:', error);
    res.status(500).json({ error: 'Failed to list models' });
  }
});

// Update a model
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'developer']),
  validateRequest({ body: modelSchema }),
  async (req, res) => {
    try {
      const model = await modelService.updateModel(req.params.id, req.body);
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }
      res.json(model);
    } catch (error) {
      logger.error('Failed to update model:', error);
      res.status(500).json({ error: 'Failed to update model' });
    }
  }
);

// Delete a model
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const model = await modelService.deleteModel(req.params.id);
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }
      res.json({ message: 'Model deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete model:', error);
      res.status(500).json({ error: 'Failed to delete model' });
    }
  }
);

export default router;
