import { Router } from 'express';
import { z } from 'zod';
import VersionService from '../services/models/VersionService';
import { validateRequest } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const versionService = VersionService.getInstance();

// Schema for version creation
const createVersionSchema = z.object({
  modelId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  config: z.record(z.any()),
  artifacts: z.array(z.string()).optional(),
});

// Schema for version metrics update
const updateMetricsSchema = z.object({
  metrics: z.record(z.any()),
});

// Create a new version
router.post(
  '/',
  authenticate,
  authorize(['admin', 'developer']),
  validateRequest({ body: createVersionSchema }),
  async (req, res) => {
    try {
      const version = await versionService.createVersion(req.body);
      res.status(201).json(version);
    } catch (error) {
      logger.error('Failed to create version:', error);
      res.status(500).json({ error: 'Failed to create version' });
    }
  }
);

// Get a version by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const version = await versionService.getVersion(req.params.id);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json(version);
  } catch (error) {
    logger.error('Failed to get version:', error);
    res.status(500).json({ error: 'Failed to get version' });
  }
});

// List versions for a model
router.get('/model/:modelId', authenticate, async (req, res) => {
  try {
    const versions = await versionService.listModelVersions(req.params.modelId);
    res.json(versions);
  } catch (error) {
    logger.error('Failed to list versions:', error);
    res.status(500).json({ error: 'Failed to list versions' });
  }
});

// Update version status
router.post('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const version = await versionService.updateVersionStatus(req.params.id, status);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json(version);
  } catch (error) {
    logger.error('Failed to update version status:', error);
    res.status(500).json({ error: 'Failed to update version status' });
  }
});

// Update version metrics
router.post(
  '/:id/metrics',
  authenticate,
  validateRequest({ body: updateMetricsSchema }),
  async (req, res) => {
    try {
      const version = await versionService.updateVersionMetrics(
        req.params.id,
        req.body.metrics
      );
      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }
      res.json(version);
    } catch (error) {
      logger.error('Failed to update version metrics:', error);
      res.status(500).json({ error: 'Failed to update version metrics' });
    }
  }
);

export default router;
