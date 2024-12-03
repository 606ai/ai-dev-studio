import express from 'express';
import * as modelController from '../controllers/models';
import * as assistantController from '../controllers/assistant';
import * as deploymentController from '../controllers/deployment';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Models
router.post(
  '/models',
  authenticate,
  authorize(['USER', 'ADMIN']),
  modelController.createModel
);
router.get(
  '/models/:id',
  authenticate,
  modelController.getModel
);
router.put(
  '/models/:id',
  authenticate,
  authorize(['USER', 'ADMIN']),
  modelController.updateModel
);
router.delete(
  '/models/:id',
  authenticate,
  authorize(['USER', 'ADMIN']),
  modelController.deleteModel
);
router.post(
  '/models/:id/versions',
  authenticate,
  authorize(['USER', 'ADMIN']),
  modelController.createVersion
);
router.post(
  '/models/versions/:versionId/deploy',
  authenticate,
  authorize(['USER', 'ADMIN']),
  modelController.deployModel
);
router.get(
  '/models/:id/metrics',
  authenticate,
  modelController.getModelMetrics
);

// Code Assistant
router.post(
  '/assistant/analyze',
  authenticate,
  assistantController.analyzeCode
);
router.post(
  '/assistant/suggestions',
  authenticate,
  assistantController.getSuggestions
);
router.post(
  '/assistant/optimize',
  authenticate,
  assistantController.optimizeCode
);
router.post(
  '/assistant/tests',
  authenticate,
  assistantController.generateTests
);

// Deployments
router.post(
  '/deployments',
  authenticate,
  authorize(['USER', 'ADMIN']),
  deploymentController.createDeployment
);
router.get(
  '/deployments/:id',
  authenticate,
  deploymentController.getDeployment
);
router.post(
  '/deployments/:id/stop',
  authenticate,
  authorize(['USER', 'ADMIN']),
  deploymentController.stopDeployment
);
router.post(
  '/deployments/:id/scale',
  authenticate,
  authorize(['USER', 'ADMIN']),
  deploymentController.scaleDeployment
);
router.get(
  '/deployments/:id/metrics',
  authenticate,
  deploymentController.getDeploymentMetrics
);
router.get(
  '/deployments/:id/logs',
  authenticate,
  deploymentController.getDeploymentLogs
);

export default router;
