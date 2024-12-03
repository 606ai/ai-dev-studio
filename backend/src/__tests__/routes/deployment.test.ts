import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { DeploymentStatus } from '@prisma/client';
import DeploymentService from '../../services/deployment/DeploymentService';
import deploymentRoutes from '../../routes/deployment';
import { authenticate, authorize } from '../../middleware/auth';

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: Request, res: Response, next: NextFunction) => next()),
  authorize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

// Mock DeploymentService
jest.mock('../../services/deployment/DeploymentService', () => ({
  getInstance: jest.fn(() => ({
    createDeployment: jest.fn(),
    getDeployment: jest.fn(),
    listModelDeployments: jest.fn(),
    stopDeployment: jest.fn(),
    scaleDeployment: jest.fn(),
    updateDeploymentMetrics: jest.fn(),
  })),
}));

describe('Deployment Routes', () => {
  let app: express.Application;
  let deploymentService: jest.Mocked<any>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/deployments', deploymentRoutes);
    deploymentService = DeploymentService.getInstance() as jest.Mocked<any>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /deployments', () => {
    const validDeployment = {
      modelId: '1',
      versionId: '1',
      environment: 'production',
      config: { replicas: 3, memory: '2Gi' },
    };

    it('should create a new deployment', async () => {
      deploymentService.createDeployment.mockResolvedValue({
        id: '1',
        status: DeploymentStatus.PENDING,
        ...validDeployment,
      });

      const response = await request(app)
        .post('/deployments')
        .send(validDeployment)
        .expect(201);

      expect(response.body).toHaveProperty('id', '1');
      expect(deploymentService.createDeployment).toHaveBeenCalledWith(validDeployment);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/deployments')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(deploymentService.createDeployment).not.toHaveBeenCalled();
    });
  });

  describe('GET /deployments/:id', () => {
    it('should get a deployment by ID', async () => {
      const mockDeployment = {
        id: '1',
        modelId: '1',
        status: DeploymentStatus.RUNNING,
      };

      deploymentService.getDeployment.mockResolvedValue(mockDeployment);

      const response = await request(app)
        .get('/deployments/1')
        .expect(200);

      expect(response.body).toEqual(mockDeployment);
      expect(deploymentService.getDeployment).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent deployment', async () => {
      deploymentService.getDeployment.mockResolvedValue(null);

      await request(app)
        .get('/deployments/999')
        .expect(404);

      expect(deploymentService.getDeployment).toHaveBeenCalledWith('999');
    });
  });

  describe('GET /deployments/model/:modelId', () => {
    it('should list deployments for a model', async () => {
      const mockDeployments = [
        { id: '1', modelId: '1', status: DeploymentStatus.RUNNING },
        { id: '2', modelId: '1', status: DeploymentStatus.STOPPED },
      ];

      deploymentService.listModelDeployments.mockResolvedValue(mockDeployments);

      const response = await request(app)
        .get('/deployments/model/1')
        .expect(200);

      expect(response.body).toEqual(mockDeployments);
      expect(deploymentService.listModelDeployments).toHaveBeenCalledWith('1');
    });
  });

  describe('POST /deployments/:id/stop', () => {
    it('should stop a deployment', async () => {
      const mockDeployment = {
        id: '1',
        modelId: '1',
        status: DeploymentStatus.STOPPED,
      };

      deploymentService.stopDeployment.mockResolvedValue(mockDeployment);

      const response = await request(app)
        .post('/deployments/1/stop')
        .expect(200);

      expect(response.body).toEqual(mockDeployment);
      expect(deploymentService.stopDeployment).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent deployment', async () => {
      deploymentService.stopDeployment.mockResolvedValue(null);

      await request(app)
        .post('/deployments/999/stop')
        .expect(404);

      expect(deploymentService.stopDeployment).toHaveBeenCalledWith('999');
    });
  });

  describe('POST /deployments/:id/scale', () => {
    it('should scale a deployment', async () => {
      const mockDeployment = {
        id: '1',
        modelId: '1',
        config: { replicas: 5 },
      };

      deploymentService.scaleDeployment.mockResolvedValue(mockDeployment);

      const response = await request(app)
        .post('/deployments/1/scale')
        .send({ replicas: 5 })
        .expect(200);

      expect(response.body).toEqual(mockDeployment);
      expect(deploymentService.scaleDeployment).toHaveBeenCalledWith('1', 5);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/deployments/1/scale')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(deploymentService.scaleDeployment).not.toHaveBeenCalled();
    });
  });

  describe('POST /deployments/:id/metrics', () => {
    const metrics = {
      cpu: '50%',
      memory: '1.5Gi',
      latency: '100ms',
    };

    it('should update deployment metrics', async () => {
      const mockDeployment = {
        id: '1',
        modelId: '1',
        metrics,
      };

      deploymentService.updateDeploymentMetrics.mockResolvedValue(mockDeployment);

      const response = await request(app)
        .post('/deployments/1/metrics')
        .send(metrics)
        .expect(200);

      expect(response.body).toEqual(mockDeployment);
      expect(deploymentService.updateDeploymentMetrics).toHaveBeenCalledWith('1', metrics);
    });
  });
});
