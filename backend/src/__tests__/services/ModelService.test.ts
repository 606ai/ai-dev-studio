import { Model, ModelStatus } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { prismaMock } from '../setup';

// Mock services before importing
const mockCacheService = {
  getInstance: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
};

const mockQueueService = {
  getInstance: jest.fn().mockReturnValue({
    publish: jest.fn(),
  }),
};

const mockWebSocketService = {
  getInstance: jest.fn().mockReturnValue({
    emit: jest.fn(),
    broadcastVersionStatus: jest.fn(),
    broadcastDeploymentStatus: jest.fn(),
  }),
};

jest.mock('../../services/cache', () => mockCacheService);
jest.mock('../../services/queue', () => mockQueueService);
jest.mock('../../services/websocket', () => mockWebSocketService);

// Import services after mocking
import ModelService from '../../services/models/ModelService';
import CacheService from '../../services/cache';
import QueueService from '../../services/queue';
import WebSocketService from '../../services/websocket';

describe('ModelService', () => {
  let modelService: ModelService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = prismaMock;
    mockReset(prisma);
    modelService = ModelService.getInstance();
    (modelService as any).prisma = prisma;
    (modelService as any).cache = mockCacheService.getInstance();
    (modelService as any).queue = mockQueueService.getInstance();
    (modelService as any).ws = mockWebSocketService.getInstance();
  });

  describe('createModel', () => {
    it('should create a new model', async () => {
      const mockModel = {
        id: '1',
        name: 'Test Model',
        description: 'Test Description',
        ownerId: 'user1',
        status: ModelStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.model.create.mockResolvedValue(mockModel);

      const result = await modelService.createModel({
        name: 'Test Model',
        description: 'Test Description',
        ownerId: 'user1',
      });

      expect(result).toEqual(mockModel);
      expect(prisma.model.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Model',
          description: 'Test Description',
          ownerId: 'user1',
          status: ModelStatus.DRAFT,
        },
        include: {
          owner: true,
          collaborators: true,
        },
      });
    });
  });

  describe('getModel', () => {
    it('should return cached model if available', async () => {
      const mockModel = {
        id: '1',
        name: 'Test Model',
        description: 'Test Description',
        ownerId: 'user1',
        status: ModelStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.getInstance().get.mockResolvedValue(mockModel);

      const result = await modelService.getModel('1');

      expect(result).toEqual(mockModel);
      expect(mockCacheService.getInstance().get).toHaveBeenCalledWith('model:1');
      expect(prisma.model.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch and cache model if not in cache', async () => {
      const mockModel = {
        id: '1',
        name: 'Test Model',
        description: 'Test Description',
        ownerId: 'user1',
        status: ModelStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.getInstance().get.mockResolvedValue(null);
      prisma.model.findUnique.mockResolvedValue(mockModel);

      const result = await modelService.getModel('1');

      expect(result).toEqual(mockModel);
      expect(mockCacheService.getInstance().get).toHaveBeenCalledWith('model:1');
      expect(prisma.model.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          owner: true,
          collaborators: true,
          versions: true,
        },
      });
      expect(mockCacheService.getInstance().set).toHaveBeenCalledWith('model:1', mockModel, { ttl: 3600 });
    });
  });

  describe('updateModel', () => {
    it('should update model and invalidate cache', async () => {
      const mockModel = {
        id: '1',
        name: 'Updated Model',
        description: 'Updated Description',
        ownerId: 'user1',
        status: ModelStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.model.update.mockResolvedValue(mockModel);

      const result = await modelService.updateModel('1', {
        name: 'Updated Model',
        description: 'Updated Description',
      });

      expect(result).toEqual(mockModel);
      expect(prisma.model.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Model',
          description: 'Updated Description',
        },
        include: {
          owner: true,
          collaborators: true,
        },
      });
      expect(mockCacheService.getInstance().delete).toHaveBeenCalledWith('model:1');
    });
  });

  describe('deleteModel', () => {
    it('should delete model and invalidate cache', async () => {
      await modelService.deleteModel('1');

      expect(prisma.model.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockCacheService.getInstance().delete).toHaveBeenCalledWith('model:1');
    });
  });
});
