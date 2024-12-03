import { PrismaClient, Model, ModelStatus } from '@prisma/client';
import { structuredLogger } from '../../monitoring/logger';

class ModelService {
  private static instance: ModelService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  async createModel(userId: string, data: { name: string; description: string }): Promise<Model> {
    structuredLogger.setContext({ service: 'ModelService', userId });
    
    try {
      const startTime = Date.now();
      
      const model = await this.prisma.model.create({
        data: {
          ...data,
          userId,
          status: ModelStatus.DRAFT,
        },
      });

      await structuredLogger.info('Model created successfully', {
        modelId: model.id,
        duration: Date.now() - startTime,
        operation: 'createModel'
      });

      return model;
    } catch (error) {
      await structuredLogger.error('Failed to create model', {
        error,
        modelData: data
      });
      throw error;
    } finally {
      structuredLogger.clearContext();
    }
  }

  async getModel(userId: string, modelId: string): Promise<Model | null> {
    structuredLogger.setContext({ service: 'ModelService', userId, modelId });
    
    try {
      const startTime = Date.now();
      
      const model = await this.prisma.model.findUnique({
        where: { id: modelId },
      });

      await structuredLogger.info('Model retrieved', {
        duration: Date.now() - startTime,
        operation: 'getModel',
        found: !!model
      });

      return model;
    } catch (error) {
      await structuredLogger.error('Failed to retrieve model', {
        error,
        modelId
      });
      throw error;
    } finally {
      structuredLogger.clearContext();
    }
  }

  async updateModelStatus(userId: string, modelId: string, status: ModelStatus): Promise<Model> {
    structuredLogger.setContext({ service: 'ModelService', userId, modelId });
    
    try {
      const startTime = Date.now();
      
      const model = await this.prisma.model.update({
        where: { id: modelId },
        data: { status },
      });

      await structuredLogger.info('Model status updated', {
        duration: Date.now() - startTime,
        operation: 'updateModelStatus',
        oldStatus: model.status,
        newStatus: status
      });

      return model;
    } catch (error) {
      await structuredLogger.error('Failed to update model status', {
        error,
        modelId,
        status
      });
      throw error;
    } finally {
      structuredLogger.clearContext();
    }
  }

  async listModels(userId: string, filter?: { status?: ModelStatus }): Promise<Model[]> {
    structuredLogger.setContext({ service: 'ModelService', userId });
    
    try {
      const startTime = Date.now();
      
      const models = await this.prisma.model.findMany({
        where: {
          userId,
          ...(filter?.status ? { status: filter.status } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      });

      await structuredLogger.info('Models listed', {
        duration: Date.now() - startTime,
        operation: 'listModels',
        count: models.length,
        filter
      });

      return models;
    } catch (error) {
      await structuredLogger.error('Failed to list models', {
        error,
        filter
      });
      throw error;
    } finally {
      structuredLogger.clearContext();
    }
  }

  async deleteModel(userId: string, modelId: string): Promise<Model> {
    structuredLogger.setContext({ service: 'ModelService', userId, modelId });
    
    try {
      const startTime = Date.now();
      
      const model = await this.prisma.model.delete({
        where: { id: modelId },
      });

      await structuredLogger.info('Model deleted', {
        duration: Date.now() - startTime,
        operation: 'deleteModel'
      });

      return model;
    } catch (error) {
      await structuredLogger.error('Failed to delete model', {
        error,
        modelId
      });
      throw error;
    } finally {
      structuredLogger.clearContext();
    }
  }
}

export default ModelService;
