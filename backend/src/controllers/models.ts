import { Request, Response } from 'express';
import { z } from 'zod';
import ModelService from '../services/models/ModelService';
import logger from '../utils/logger';

const modelService = ModelService.getInstance();

const createModelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateModelSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'TRAINING', 'READY', 'DEPLOYED', 'ARCHIVED']).optional(),
});

const createVersionSchema = z.object({
  version: z.string(),
  artifacts: z.any(),
});

export const createModel = async (req: Request, res: Response) => {
  try {
    const { name, description } = createModelSchema.parse(req.body);
    const model = await modelService.createModel({
      name,
      description,
      ownerId: req.user!.id,
    });

    res.status(201).json(model);
  } catch (error) {
    logger.error('Error creating model:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const getModel = async (req: Request, res: Response) => {
  try {
    const model = await modelService.getModel(req.params.id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json(model);
  } catch (error) {
    logger.error('Error getting model:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateModel = async (req: Request, res: Response) => {
  try {
    const data = updateModelSchema.parse(req.body);
    const model = await modelService.updateModel(req.params.id, data);
    res.json(model);
  } catch (error) {
    logger.error('Error updating model:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const deleteModel = async (req: Request, res: Response) => {
  try {
    await modelService.deleteModel(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting model:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createVersion = async (req: Request, res: Response) => {
  try {
    const { version, artifacts } = createVersionSchema.parse(req.body);
    const modelVersion = await modelService.createVersion(req.params.id, {
      version,
      artifacts,
    });

    res.status(201).json(modelVersion);
  } catch (error) {
    logger.error('Error creating version:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const deployModel = async (req: Request, res: Response) => {
  try {
    const deployment = await modelService.deployModel(
      req.params.versionId,
      req.body.config
    );

    res.status(201).json(deployment);
  } catch (error) {
    logger.error('Error deploying model:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getModelMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await modelService.getModelMetrics(req.params.id);
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting model metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
