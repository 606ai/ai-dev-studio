import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { VersionStatus } from '@prisma/client';
import VersionService from '../../services/models/VersionService';
import versionRoutes from '../../routes/version';
import { authenticate, authorize } from '../../middleware/auth';

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: Request, res: Response, next: NextFunction) => next()),
  authorize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

// Mock VersionService
jest.mock('../../services/models/VersionService', () => ({
  getInstance: jest.fn(() => ({
    createVersion: jest.fn(),
    getVersion: jest.fn(),
    listModelVersions: jest.fn(),
    updateVersionStatus: jest.fn(),
    updateVersionMetrics: jest.fn(),
  })),
}));

describe('Version Routes', () => {
  let app: express.Application;
  let versionService: jest.Mocked<any>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/versions', versionRoutes);
    versionService = VersionService.getInstance() as jest.Mocked<any>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /versions', () => {
    const validVersion = {
      modelId: '1',
      name: 'v1.0.0',
      description: 'Initial version',
      config: { epochs: 100, batchSize: 32 },
      artifacts: ['model.pt', 'config.json'],
    };

    it('should create a new version', async () => {
      versionService.createVersion.mockResolvedValue({
        id: '1',
        status: VersionStatus.CREATED,
        ...validVersion,
      });

      const response = await request(app)
        .post('/versions')
        .send(validVersion)
        .expect(201);

      expect(response.body).toHaveProperty('id', '1');
      expect(versionService.createVersion).toHaveBeenCalledWith(validVersion);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/versions')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(versionService.createVersion).not.toHaveBeenCalled();
    });
  });

  describe('GET /versions/:id', () => {
    it('should get a version by ID', async () => {
      const mockVersion = {
        id: '1',
        modelId: '1',
        name: 'v1.0.0',
        status: VersionStatus.READY,
      };

      versionService.getVersion.mockResolvedValue(mockVersion);

      const response = await request(app)
        .get('/versions/1')
        .expect(200);

      expect(response.body).toEqual(mockVersion);
      expect(versionService.getVersion).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent version', async () => {
      versionService.getVersion.mockResolvedValue(null);

      await request(app)
        .get('/versions/999')
        .expect(404);

      expect(versionService.getVersion).toHaveBeenCalledWith('999');
    });
  });

  describe('GET /versions/model/:modelId', () => {
    it('should list versions for a model', async () => {
      const mockVersions = [
        { id: '1', modelId: '1', name: 'v1.0.0', status: VersionStatus.READY },
        { id: '2', modelId: '1', name: 'v1.1.0', status: VersionStatus.CREATED },
      ];

      versionService.listModelVersions.mockResolvedValue(mockVersions);

      const response = await request(app)
        .get('/versions/model/1')
        .expect(200);

      expect(response.body).toEqual(mockVersions);
      expect(versionService.listModelVersions).toHaveBeenCalledWith('1');
    });
  });

  describe('POST /versions/:id/status', () => {
    it('should update version status', async () => {
      const mockVersion = {
        id: '1',
        modelId: '1',
        status: VersionStatus.READY,
      };

      versionService.updateVersionStatus.mockResolvedValue(mockVersion);

      const response = await request(app)
        .post('/versions/1/status')
        .send({ status: VersionStatus.READY })
        .expect(200);

      expect(response.body).toEqual(mockVersion);
      expect(versionService.updateVersionStatus).toHaveBeenCalledWith(
        '1',
        VersionStatus.READY
      );
    });

    it('should return 404 for non-existent version', async () => {
      versionService.updateVersionStatus.mockResolvedValue(null);

      await request(app)
        .post('/versions/999/status')
        .send({ status: VersionStatus.READY })
        .expect(404);

      expect(versionService.updateVersionStatus).toHaveBeenCalledWith(
        '999',
        VersionStatus.READY
      );
    });
  });

  describe('POST /versions/:id/metrics', () => {
    const metrics = {
      accuracy: 0.95,
      loss: 0.05,
      f1Score: 0.94,
    };

    it('should update version metrics', async () => {
      const mockVersion = {
        id: '1',
        modelId: '1',
        metrics,
      };

      versionService.updateVersionMetrics.mockResolvedValue(mockVersion);

      const response = await request(app)
        .post('/versions/1/metrics')
        .send({ metrics })
        .expect(200);

      expect(response.body).toEqual(mockVersion);
      expect(versionService.updateVersionMetrics).toHaveBeenCalledWith('1', metrics);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/versions/1/metrics')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(versionService.updateVersionMetrics).not.toHaveBeenCalled();
    });
  });
});
