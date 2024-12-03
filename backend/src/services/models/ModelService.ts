import { PrismaClient, Model, ModelVersion, Deployment, VersionStatus, DeploymentStatus } from '@prisma/client';
import QueueService from '../queue';
import CacheService from '../cache';
import WebSocketService from '../websocket';
import logger from '../../utils/logger';

class ModelService {
  private static instance: ModelService;
  private prisma: PrismaClient;
  private queue: QueueService;
  private cache: CacheService;
  private ws: WebSocketService;

  private constructor() {
    this.prisma = new PrismaClient();
    this.queue = QueueService.getInstance();
    this.cache = CacheService.getInstance();
    this.ws = WebSocketService.getInstance();
  }

  public static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  async createModel(data: { name: string; description: string; ownerId: string }): Promise<Model> {
    try {
      const model = await this.prisma.model.create({
        data: {
          ...data,
          status: 'DRAFT',
        },
        include: {
          owner: true,
          collaborators: true,
        },
      });

      logger.info(`Created model ${model.id}`);
      return model;
    } catch (error) {
      logger.error('Failed to create model:', error);
      throw error;
    }
  }

  async getModel(id: string): Promise<Model | null> {
    try {
      const cacheKey = `model:${id}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as Model;
      }

      const model = await this.prisma.model.findUnique({
        where: { id },
        include: {
          owner: true,
          collaborators: true,
          versions: true,
        },
      });

      if (model) {
        await this.cache.set(cacheKey, model, { ttl: 3600 });
      }

      return model;
    } catch (error) {
      logger.error(`Failed to get model ${id}:`, error);
      throw error;
    }
  }

  async updateModel(id: string, data: Partial<{ name: string; description: string }>): Promise<Model> {
    try {
      const model = await this.prisma.model.update({
        where: { id },
        data,
        include: {
          owner: true,
          collaborators: true,
        },
      });

      await this.cache.delete(`model:${id}`);
      logger.info(`Updated model ${id}`);
      return model;
    } catch (error) {
      logger.error(`Failed to update model ${id}:`, error);
      throw error;
    }
  }

  async deleteModel(id: string): Promise<void> {
    try {
      await this.prisma.model.delete({
        where: { id },
      });

      await this.cache.delete(`model:${id}`);
      logger.info(`Deleted model ${id}`);
    } catch (error) {
      logger.error(`Failed to delete model ${id}:`, error);
      throw error;
    }
  }

  async createVersion(modelId: string, data: { artifacts: any }): Promise<ModelVersion> {
    try {
      const version = await this.prisma.modelVersion.create({
        data: {
          modelId,
          artifacts: data.artifacts,
          status: 'CREATED',
          version: new Date().toISOString(),
        },
        include: {
          model: true,
        },
      });

      logger.info(`Created version ${version.id} for model ${modelId}`);
      return version;
    } catch (error) {
      logger.error(`Failed to create version for model ${modelId}:`, error);
      throw error;
    }
  }

  async updateVersionStatus(versionId: string, status: VersionStatus, metrics?: any): Promise<ModelVersion> {
    try {
      const version = await this.prisma.modelVersion.update({
        where: { id: versionId },
        data: {
          status,
          metrics,
        },
        include: {
          model: true,
        },
      });

      this.ws.broadcastVersionStatus(version.modelId, {
        modelId: version.modelId,
        versionId,
        status,
        metrics,
      });

      logger.info(`Updated version ${versionId} status to ${status}`);
      return version;
    } catch (error) {
      logger.error(`Failed to update version ${versionId} status:`, error);
      throw error;
    }
  }

  async deployVersion(versionId: string, config: any): Promise<Deployment> {
    try {
      const version = await this.prisma.modelVersion.findUnique({
        where: { id: versionId },
        select: { modelId: true },
      });

      if (!version) {
        throw new Error(`Version ${versionId} not found`);
      }

      const deployment = await this.prisma.deployment.create({
        data: {
          versionId,
          modelId: version.modelId,
          environment: config.environment || 'production',
          config,
          status: 'PENDING',
        },
        include: {
          version: {
            include: {
              model: true,
            },
          },
        },
      });

      await this.queue.publishMessage('deployment.create', {
        deploymentId: deployment.id,
        config,
      });

      logger.info(`Created deployment ${deployment.id} for version ${versionId}`);
      return deployment;
    } catch (error) {
      logger.error(`Failed to deploy version ${versionId}:`, error);
      throw error;
    }
  }

  async updateDeploymentStatus(deploymentId: string, status: DeploymentStatus, metrics?: any): Promise<Deployment> {
    try {
      const deployment = await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status,
          metrics,
        },
        include: {
          version: {
            include: {
              model: true,
            },
          },
        },
      });

      this.ws.broadcastDeploymentStatus(deployment.version.model.id, {
        modelId: deployment.version.model.id,
        deploymentId,
        status,
        metrics,
      });

      logger.info(`Updated deployment ${deploymentId} status to ${status}`);
      return deployment;
    } catch (error) {
      logger.error(`Failed to update deployment ${deploymentId} status:`, error);
      throw error;
    }
  }
}

export default ModelService;
