import { Router } from 'express';
import { z } from 'zod';
import DeploymentService from '../services/deployment/DeploymentService';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const deploymentService = DeploymentService.getInstance();

// Schema for deployment creation
const createDeploymentSchema = z.object({
  modelId: z.string(),
  versionId: z.string(),
  environment: z.string(),
  config: z.record(z.any()),
});

// Schema for deployment scaling
const scaleDeploymentSchema = z.object({
  replicas: z.number().int().min(0).max(10),
});

// Create a new deployment
router.post(
  '/',
  authenticate,
  validateRequest({ body: createDeploymentSchema }),
  async (req, res) => {
    try {
      const deployment = await deploymentService.createDeployment(req.body);
      res.status(201).json(deployment);
    } catch (error) {
      logger.error('Failed to create deployment:', error);
      res.status(500).json({ error: 'Failed to create deployment' });
    }
  }
);

// Get a deployment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const deployment = await deploymentService.getDeployment(req.params.id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    res.json(deployment);
  } catch (error) {
    logger.error('Failed to get deployment:', error);
    res.status(500).json({ error: 'Failed to get deployment' });
  }
});

// List deployments for a model
router.get('/model/:modelId', authenticate, async (req, res) => {
  try {
    const deployments = await deploymentService.listModelDeployments(req.params.modelId);
    res.json(deployments);
  } catch (error) {
    logger.error('Failed to list deployments:', error);
    res.status(500).json({ error: 'Failed to list deployments' });
  }
});

// Stop a deployment
router.post('/:id/stop', authenticate, async (req, res) => {
  try {
    const deployment = await deploymentService.stopDeployment(req.params.id);
    res.json(deployment);
  } catch (error) {
    logger.error('Failed to stop deployment:', error);
    res.status(500).json({ error: 'Failed to stop deployment' });
  }
});

// Scale a deployment
router.post(
  '/:id/scale',
  authenticate,
  validateRequest({ body: scaleDeploymentSchema }),
  async (req, res) => {
    try {
      const deployment = await deploymentService.scaleDeployment(
        req.params.id,
        req.body.replicas
      );
      res.json(deployment);
    } catch (error) {
      logger.error('Failed to scale deployment:', error);
      res.status(500).json({ error: 'Failed to scale deployment' });
    }
  }
);

// Update deployment metrics
router.post('/:id/metrics', authenticate, async (req, res) => {
  try {
    const deployment = await deploymentService.updateDeploymentMetrics(
      req.params.id,
      req.body
    );
    res.json(deployment);
  } catch (error) {
    logger.error('Failed to update deployment metrics:', error);
    res.status(500).json({ error: 'Failed to update deployment metrics' });
  }
});

export default router;
