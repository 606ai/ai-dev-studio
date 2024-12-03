import { PrismaClient, Deployment, DeploymentStatus } from '@prisma/client';
import QueueService from '../queue';
import WebSocketService from '../websocket';
import CacheService from '../cache';
import { logger, logAudit, logPerformance } from '../../monitoring/logger';

export interface CreateDeploymentInput {
  modelId: string;
  versionId: string;
  environment: string;
  config: Record<string, any>;
}

class DeploymentService {
  private static instance: DeploymentService;
  private prisma: PrismaClient;
  private queue: QueueService;
  private ws: WebSocketService;
  private cache: CacheService;

  private constructor() {
    this.prisma = new PrismaClient();
    this.queue = QueueService.getInstance();
    this.ws = WebSocketService.getInstance();
    this.cache = CacheService.getInstance();
  }

  public static getInstance(): DeploymentService {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  public async createDeployment(userId: string, input: CreateDeploymentInput): Promise<Deployment> {
    const start = Date.now();
    try {
      logger.info(`Creating new deployment for model ${input.modelId}`);
      
      const deployment = await this.prisma.deployment.create({
        data: {
          modelId: input.modelId,
          versionId: input.versionId,
          environment: input.environment,
          config: input.config,
          status: DeploymentStatus.PENDING,
        },
        include: {
          model: true,
          version: true,
        },
      });

      logger.info(`Created deployment ${deployment.id} for model ${deployment.modelId}`);

      this.ws.broadcastDeploymentStatus(deployment.modelId, {
        modelId: deployment.modelId,
        deploymentId: deployment.id,
        status: deployment.status,
      });

      await this.queue.publishMessage('deployment:create', {
        deploymentId: deployment.id,
        modelId: deployment.modelId,
        versionId: deployment.versionId,
        environment: deployment.environment,
        config: deployment.config,
      });

      logAudit(userId, 'created', `deployment/${deployment.id}`);
      logPerformance('createDeployment', Date.now() - start, { modelId: input.modelId });
      
      return deployment;
    } catch (error) {
      logger.error('Failed to create deployment:', error);
      throw error;
    }
  }

  public async getDeployment(id: string): Promise<Deployment | null> {
    const start = Date.now();
    try {
      logger.info(`Getting deployment ${id}`);
      
      const cacheKey = `deployment:${id}`;
      const cached = await this.cache.get<Deployment>(cacheKey);
      if (cached) return cached;

      const deployment = await this.prisma.deployment.findUnique({
        where: { id },
        include: {
          model: true,
          version: true,
        },
      });

      if (deployment) {
        await this.cache.set(cacheKey, deployment, { ttl: 3600 });
      }

      logPerformance('getDeployment', Date.now() - start, { id });
      
      return deployment;
    } catch (error) {
      logger.error(`Failed to get deployment ${id}:`, error);
      throw error;
    }
  }

  public async updateDeploymentStatus(userId: string, id: string, status: DeploymentStatus): Promise<Deployment> {
    const start = Date.now();
    try {
      logger.info(`Updating deployment ${id} status to ${status}`);
      
      const deployment = await this.prisma.deployment.update({
        where: { id },
        data: { status },
        include: {
          model: true,
          version: true,
        },
      });

      await this.cache.delete(`deployment:${id}`);

      logger.info(`Updated deployment ${id} status to ${status}`);
      this.ws.broadcastDeploymentStatus(deployment.modelId, {
        modelId: deployment.modelId,
        deploymentId: deployment.id,
        status: deployment.status,
      });

      logAudit(userId, 'updated', `deployment/${id}`);
      logPerformance('updateDeploymentStatus', Date.now() - start, { id });
      
      return deployment;
    } catch (error) {
      logger.error(`Failed to update deployment ${id} status:`, error);
      throw error;
    }
  }

  public async updateDeploymentMetrics(userId: string, id: string, metrics: Record<string, number>): Promise<Deployment> {
    const start = Date.now();
    try {
      logger.info(`Updating deployment ${id} metrics`);
      
      const deployment = await this.prisma.deployment.update({
        where: { id },
        data: { metrics },
        include: {
          model: true,
          version: true,
        },
      });

      await this.cache.delete(`deployment:${id}`);

      logger.info(`Updated deployment ${id} metrics`);
      this.ws.broadcastDeploymentStatus(deployment.modelId, {
        modelId: deployment.modelId,
        deploymentId: deployment.id,
        status: deployment.status,
        metrics,
      });

      logAudit(userId, 'updated', `deployment/${id}`);
      logPerformance('updateDeploymentMetrics', Date.now() - start, { id });
      
      return deployment;
    } catch (error) {
      logger.error(`Failed to update deployment ${id} metrics:`, error);
      throw error;
    }
  }

  public async listModelDeployments(userId: string, modelId: string): Promise<Deployment[]> {
    const start = Date.now();
    try {
      logger.info(`Listing deployments for model ${modelId}`);
      
      const deployments = await this.prisma.deployment.findMany({
        where: { modelId },
        orderBy: { createdAt: 'desc' },
        include: {
          model: true,
          version: true,
        },
      });

      logPerformance('listModelDeployments', Date.now() - start, { modelId });
      
      return deployments;
    } catch (error) {
      logger.error(`Failed to list deployments for model ${modelId}:`, error);
      throw error;
    }
  }

  public async stopDeployment(userId: string, id: string): Promise<Deployment> {
    const start = Date.now();
    try {
      logger.info(`Stopping deployment ${id}`);
      
      const deployment = await this.updateDeploymentStatus(userId, id, DeploymentStatus.STOPPED);
      await this.queue.publishMessage('deployment:stop', { deploymentId: id });

      logAudit(userId, 'stopped', `deployment/${id}`);
      logPerformance('stopDeployment', Date.now() - start, { id });
      
      return deployment;
    } catch (error) {
      logger.error(`Failed to stop deployment ${id}:`, error);
      throw error;
    }
  }

  public async scaleDeployment(userId: string, id: string, replicas: number): Promise<Deployment> {
    const start = Date.now();
    try {
      logger.info(`Scaling deployment ${id} to ${replicas} replicas`);
      
      const deployment = await this.getDeployment(id);
      if (!deployment) {
        throw new Error('Deployment not found');
      }

      const config = deployment.config as Record<string, any>;
      const updatedConfig = {
        ...config,
        replicas,
      };

      const updated = await this.prisma.deployment.update({
        where: { id },
        data: { config: updatedConfig },
        include: {
          model: true,
          version: true,
        },
      });

      await this.cache.delete(`deployment:${id}`);
      await this.queue.publishMessage('deployment:scale', {
        deploymentId: id,
        replicas,
      });

      logAudit(userId, 'scaled', `deployment/${id}`);
      logPerformance('scaleDeployment', Date.now() - start, { id });
      
      return updated;
    } catch (error) {
      logger.error(`Failed to scale deployment ${id}:`, error);
      throw error;
    }
  }
}

export default DeploymentService;
