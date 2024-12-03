import { Request, Response } from 'express';
import { z } from 'zod';
import DeploymentService from '../services/deployment/DeploymentService';
import logger from '../utils/logger';

const deploymentService = DeploymentService.getInstance();

const createDeploymentSchema = z.object({
  modelId: z.string(),
  versionId: z.string(),
  environment: z.string(),
  config: z.any(),
});

const scaleDeploymentSchema = z.object({
  replicas: z.number().int().positive(),
});

const getLogsSchema = z.object({
  limit: z.number().int().positive().default(100),
  startTime: z.string().datetime().optional(),
  filter: z.string().optional(),
});

export const createDeployment = async (req: Request, res: Response) => {
  try {
    const data = createDeploymentSchema.parse(req.body);
    const deployment = await deploymentService.createDeployment(data);
    res.status(201).json(deployment);
  } catch (error) {
    logger.error('Error creating deployment:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const getDeployment = async (req: Request, res: Response) => {
  try {
    const deployment = await deploymentService.getDeployment(req.params.id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    res.json(deployment);
  } catch (error) {
    logger.error('Error getting deployment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const stopDeployment = async (req: Request, res: Response) => {
  try {
    const deployment = await deploymentService.stopDeployment(req.params.id);
    res.json(deployment);
  } catch (error) {
    logger.error('Error stopping deployment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const scaleDeployment = async (req: Request, res: Response) => {
  try {
    const { replicas } = scaleDeploymentSchema.parse(req.body);
    const deployment = await deploymentService.scaleDeployment(
      req.params.id,
      replicas
    );
    res.json(deployment);
  } catch (error) {
    logger.error('Error scaling deployment:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const getDeploymentMetrics = async (req: Request, res: Response) => {
  try {
    const timeRange = {
      start: new Date(req.query.start as string),
      end: new Date(req.query.end as string),
    };

    const metrics = await deploymentService.getDeploymentMetrics(
      req.params.id,
      timeRange
    );
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting deployment metrics:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};

export const getDeploymentLogs = async (req: Request, res: Response) => {
  try {
    const options = getLogsSchema.parse(req.query);
    const logs = await deploymentService.getDeploymentLogs(req.params.id, {
      limit: options.limit,
      startTime: options.startTime ? new Date(options.startTime) : undefined,
      filter: options.filter,
    });
    res.json({ logs });
  } catch (error) {
    logger.error('Error getting deployment logs:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
};
