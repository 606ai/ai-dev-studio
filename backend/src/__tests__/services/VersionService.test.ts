import { ModelVersion, VersionStatus } from '@prisma/client';
import { DeepMockProxy, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { prismaMock } from '../setup';

// Mock services
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
  }),
};

jest.mock('../../services/cache', () => mockCacheService);
jest.mock('../../services/queue', () => mockQueueService);
jest.mock('../../services/websocket', () => mockWebSocketService);

// Import services after mocking
import VersionService from '../../services/models/VersionService';
import CacheService from '../../services/cache';
import QueueService from '../../services/queue';
import WebSocketService from '../../services/websocket';

describe('VersionService', () => {
  let versionService: VersionService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = prismaMock;
    mockReset(prisma);
    versionService = VersionService.getInstance();
    (versionService as any).prisma = prisma;
    (versionService as any).cache = mockCacheService.getInstance();
    (versionService as any).queue = mockQueueService.getInstance();
    (versionService as any).ws = mockWebSocketService.getInstance();
  });

  describe('createVersion', () => {
    it('should create a new version', async () => {
      const mockVersion = {
        id: '1',
        modelId: '1',
        version: '1.0.0',
        metrics: null,
        artifacts: {},
        status: VersionStatus.CREATED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.modelVersion.create.mockResolvedValue(mockVersion);

      const result = await versionService.createVersion({
        modelId: '1',
        version: '1.0.0',
        artifacts: {},
      });

      expect(result).toEqual(mockVersion);
      expect(prisma.modelVersion.create).toHaveBeenCalledWith({
        data: {
          modelId: '1',
          version: '1.0.0',
          artifacts: {},
          status: VersionStatus.CREATED,
        },
        include: {
          model: true,
        },
      });
      expect(mockWebSocketService.getInstance().broadcastVersionStatus)
        .toHaveBeenCalledWith('1', {
          modelId: '1',
          versionId: '1',
          status: VersionStatus.CREATED,
        });
    });
  });

  describe('getVersion', () => {
    it('should return cached version if available', async () => {
      const mockVersion = {
        id: '1',
        modelId: '1',
        version: '1.0.0',
        metrics: null,
        artifacts: {},
        status: VersionStatus.CREATED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.getInstance().get.mockResolvedValue(mockVersion);

      const result = await versionService.getVersion('1');

      expect(result).toEqual(mockVersion);
      expect(mockCacheService.getInstance().get).toHaveBeenCalledWith('version:1');
      expect(prisma.modelVersion.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch and cache version if not in cache', async () => {
      const mockVersion = {
        id: '1',
        modelId: '1',
        version: '1.0.0',
        metrics: null,
        artifacts: {},
        status: VersionStatus.CREATED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.getInstance().get.mockResolvedValue(null);
      prisma.modelVersion.findUnique.mockResolvedValue(mockVersion);

      const result = await versionService.getVersion('1');

      expect(result).toEqual(mockVersion);
      expect(mockCacheService.getInstance().get).toHaveBeenCalledWith('version:1');
      expect(prisma.modelVersion.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          model: true,
        },
      });
      expect(mockCacheService.getInstance().set).toHaveBeenCalledWith('version:1', mockVersion, { ttl: 3600 });
    });
  });

  describe('updateVersionStatus', () => {
    it('should update version status and broadcast event', async () => {
      const mockVersion = {
        id: '1',
        modelId: '1',
        version: '1.0.0',
        metrics: null,
        artifacts: {},
        status: VersionStatus.READY,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.modelVersion.update.mockResolvedValue(mockVersion);

      const result = await versionService.updateVersionStatus('1', VersionStatus.READY);

      expect(result).toEqual(mockVersion);
      expect(prisma.modelVersion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: VersionStatus.READY },
        include: {
          model: true,
        },
      });
      expect(mockCacheService.getInstance().delete).toHaveBeenCalledWith('version:1');
      expect(mockWebSocketService.getInstance().broadcastVersionStatus)
        .toHaveBeenCalledWith('1', {
          modelId: '1',
          versionId: '1',
          status: VersionStatus.READY,
        });
    });
  });

  describe('updateVersionMetrics', () => {
    it('should update version metrics', async () => {
      const metrics = { accuracy: 0.95, loss: 0.05 };
      const mockVersion = {
        id: '1',
        modelId: '1',
        version: '1.0.0',
        metrics,
        artifacts: {},
        status: VersionStatus.READY,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.modelVersion.update.mockResolvedValue(mockVersion);

      const result = await versionService.updateVersionMetrics('1', metrics);

      expect(result).toEqual(mockVersion);
      expect(prisma.modelVersion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { metrics },
        include: {
          model: true,
        },
      });
      expect(mockCacheService.getInstance().delete).toHaveBeenCalledWith('version:1');
    });
  });

  describe('listModelVersions', () => {
    it('should list all versions for a model', async () => {
      const mockVersions = [
        {
          id: '1',
          modelId: '1',
          version: '1.0.0',
          metrics: null,
          artifacts: {},
          status: VersionStatus.READY,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          modelId: '1',
          version: '1.0.1',
          metrics: null,
          artifacts: {},
          status: VersionStatus.CREATED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.modelVersion.findMany.mockResolvedValue(mockVersions);

      const result = await versionService.listModelVersions('1');

      expect(result).toEqual(mockVersions);
      expect(prisma.modelVersion.findMany).toHaveBeenCalledWith({
        where: { modelId: '1' },
        orderBy: { createdAt: 'desc' },
        include: {
          model: true,
        },
      });
    });
  });
});
