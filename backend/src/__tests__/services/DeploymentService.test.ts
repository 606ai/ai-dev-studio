import { Deployment, DeploymentStatus } from '@prisma/client';
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
    publishMessage: jest.fn(),
  }),
};

const mockWebSocketService = {
  getInstance: jest.fn().mockReturnValue({
    emit: jest.fn(),
    broadcastDeploymentStatus: jest.fn(),
  }),
};

jest.mock('../../services/cache', () => mockCacheService);
jest.mock('../../services/queue', () => mockQueueService);
jest.mock('../../services/websocket', () => mockWebSocketService);

// Import services after mocking
import DeploymentService from '../../services/deployment/DeploymentService';
import CacheService from '../../services/cache';
import QueueService from '../../services/queue';
import WebSocketService from '../../services/websocket';

describe('DeploymentService', () => {
  let deploymentService: DeploymentService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = prismaMock;
    mockReset(prisma);
    deploymentService = DeploymentService.getInstance();
    (deploymentService as any).prisma = prisma;
    (deploymentService as any).cache = mockCacheService.getInstance();
    (deploymentService as any).queue = mockQueueService.getInstance();
    (deploymentService as any).ws = mockWebSocketService.getInstance();
  });

  describe('createDeployment', () => {
    it('should create a new deployment', async () => {
      const mockDeployment = {
        id: '1',
        modelId: '1',
        versionId: '1',
        environment: 'production',
        status: DeploymentStatus.PENDING,
        metrics: null,
        config: { replicas: 3, memory: '2Gi' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.deployment.create.mockResolvedValue(mockDeployment);

      const result = await deploymentService.createDeployment({
        modelId: '1',
        versionId: '1',
        environment: 'production',
        config: { replicas: 3, memory: '2Gi' },
      });

      expect(result).toEqual(mockDeployment);
      expect(prisma.deployment.create).toHaveBeenCalledWith({
        data: {
          modelId: '1',
          versionId: '1',
          environment: 'production',
          config: { replicas: 3, memory: '2Gi' },
          status: DeploymentStatus.PENDING,
        },
        include: {
          model: true,
          version: true,
        },
      });
      expect(mockWebSocketService.getInstance().broadcastDeploymentStatus)
        .toHaveBeenCalledWith('1', {
          modelId: '1',
          deploymentId: '1',
          status: DeploymentStatus.PENDING,
        });
      expect(mockQueueService.getInstance().publishMessage)
        .toHaveBeenCalledWith('deployment:create', {
          deploymentId: '1',
          modelId: '1',
          versionId: '1',
          environment: 'production',
          config: { replicas: 3, memory: '2Gi' },
        });
    });
  });

  describe('getDeployment', () => {
    it('should return cached deployment if available', async () => {
      const mockDeployment = {
        id: '1',
        modelId: '1',
        versionId: '1',
        environment: 'production',
        status: DeploymentStatus.RUNNING,
        metrics: { requests: 100, latency: 50 },
        config: { replicas: 3, memory: '2Gi' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.getInstance().get.mockResolvedValue(mockDeployment);

      const result = await deploymentService.getDeployment('1');

      expect(result).toEqual(mockDeployment);
      expect(mockCacheService.getInstance().get).toHaveBeenCalledWith('deployment:1');
      expect(prisma.deployment.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch and cache deployment if not in cache', async () => {
      const mockDeployment = {
        id: '1',
        modelId: '1',
        versionId: '1',
        environment: 'production',
        status: DeploymentStatus.RUNNING,
        metrics: { requests: 100, latency: 50 },
        config: { replicas: 3, memory: '2Gi' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.getInstance().get.mockResolvedValue(null);
      prisma.deployment.findUnique.mockResolvedValue(mockDeployment);

      const result = await deploymentService.getDeployment('1');

      expect(result).toEqual(mockDeployment);
      expect(mockCacheService.getInstance().get).toHaveBeenCalledWith('deployment:1');
      expect(prisma.deployment.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          model: true,
          version: true,
        },
      });
      expect(mockCacheService.getInstance().set).toHaveBeenCalledWith('deployment:1', mockDeployment, { ttl: 3600 });
    });
  });

  describe('updateDeploymentStatus', () => {
    it('should update deployment status and broadcast event', async () => {
      const mockDeployment = {
        id: '1',
        modelId: '1',
        versionId: '1',
        environment: 'production',
        status: DeploymentStatus.RUNNING,
        metrics: null,
        config: { replicas: 3, memory: '2Gi' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.deployment.update.mockResolvedValue(mockDeployment);

      const result = await deploymentService.updateDeploymentStatus('1', DeploymentStatus.RUNNING);

      expect(result).toEqual(mockDeployment);
      expect(prisma.deployment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: DeploymentStatus.RUNNING },
        include: {
          model: true,
          version: true,
        },
      });
      expect(mockCacheService.getInstance().delete).toHaveBeenCalledWith('deployment:1');
      expect(mockWebSocketService.getInstance().broadcastDeploymentStatus)
        .toHaveBeenCalledWith('1', {
          modelId: '1',
          deploymentId: '1',
          status: DeploymentStatus.RUNNING,
        });
    });
  });

  describe('updateDeploymentMetrics', () => {
    it('should update deployment metrics', async () => {
      const metrics = { requests: 100, latency: 50 };
      const mockDeployment = {
        id: '1',
        modelId: '1',
        versionId: '1',
        environment: 'production',
        status: DeploymentStatus.RUNNING,
        metrics,
        config: { replicas: 3, memory: '2Gi' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.deployment.update.mockResolvedValue(mockDeployment);

      const result = await deploymentService.updateDeploymentMetrics('1', metrics);

      expect(result).toEqual(mockDeployment);
      expect(prisma.deployment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { metrics },
        include: {
          model: true,
          version: true,
        },
      });
      expect(mockCacheService.getInstance().delete).toHaveBeenCalledWith('deployment:1');
      expect(mockWebSocketService.getInstance().broadcastDeploymentStatus)
        .toHaveBeenCalledWith('1', {
          modelId: '1',
          deploymentId: '1',
          status: DeploymentStatus.RUNNING,
          metrics,
        });
    });
  });

  describe('listModelDeployments', () => {
    it('should list all deployments for a model', async () => {
      const mockDeployments = [
        {
          id: '1',
          modelId: '1',
          versionId: '1',
          environment: 'production',
          status: DeploymentStatus.RUNNING,
          metrics: { requests: 100, latency: 50 },
          config: { replicas: 3, memory: '2Gi' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          modelId: '1',
          versionId: '2',
          environment: 'staging',
          status: DeploymentStatus.PENDING,
          metrics: null,
          config: { replicas: 1, memory: '1Gi' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.deployment.findMany.mockResolvedValue(mockDeployments);

      const result = await deploymentService.listModelDeployments('1');

      expect(result).toEqual(mockDeployments);
      expect(prisma.deployment.findMany).toHaveBeenCalledWith({
        where: { modelId: '1' },
        orderBy: { createdAt: 'desc' },
        include: {
          model: true,
          version: true,
        },
      });
    });
  });
});
