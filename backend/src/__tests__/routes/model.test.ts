import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { ModelStatus } from '@prisma/client';
import ModelService from '../../services/models/ModelService';
import modelRoutes from '../../routes/model';
import { authenticate, authorize } from '../../middleware/auth';

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: Request, res: Response, next: NextFunction) => next()),
  authorize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

// Mock ModelService
jest.mock('../../services/models/ModelService', () => ({
  getInstance: jest.fn(() => ({
    createModel: jest.fn(),
    getModel: jest.fn(),
    listModels: jest.fn(),
    updateModel: jest.fn(),
    deleteModel: jest.fn(),
  })),
}));

describe('Model Routes', () => {
  let app: express.Application;
  let modelService: jest.Mocked<any>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/models', modelRoutes);
    modelService = ModelService.getInstance() as jest.Mocked<any>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /models', () => {
    const validModel = {
      name: 'Test Model',
      description: 'Test Description',
      framework: 'PyTorch',
      repository: 'https://github.com/test/model',
      tags: ['test', 'model'],
    };

    it('should create a new model', async () => {
      modelService.createModel.mockResolvedValue({
        id: '1',
        status: ModelStatus.DRAFT,
        ...validModel,
      });

      const response = await request(app)
        .post('/models')
        .send(validModel)
        .expect(201);

      expect(response.body).toHaveProperty('id', '1');
      expect(modelService.createModel).toHaveBeenCalledWith(validModel);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/models')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(modelService.createModel).not.toHaveBeenCalled();
    });
  });

  describe('GET /models/:id', () => {
    it('should get a model by ID', async () => {
      const mockModel = {
        id: '1',
        name: 'Test Model',
        status: ModelStatus.DRAFT,
      };

      modelService.getModel.mockResolvedValue(mockModel);

      const response = await request(app)
        .get('/models/1')
        .expect(200);

      expect(response.body).toEqual(mockModel);
      expect(modelService.getModel).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent model', async () => {
      modelService.getModel.mockResolvedValue(null);

      await request(app)
        .get('/models/999')
        .expect(404);

      expect(modelService.getModel).toHaveBeenCalledWith('999');
    });
  });

  describe('GET /models', () => {
    it('should list all models', async () => {
      const mockModels = [
        { id: '1', name: 'Model 1', status: ModelStatus.DRAFT },
        { id: '2', name: 'Model 2', status: ModelStatus.DRAFT },
      ];

      modelService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/models')
        .expect(200);

      expect(response.body).toEqual(mockModels);
      expect(modelService.listModels).toHaveBeenCalled();
    });
  });

  describe('PUT /models/:id', () => {
    const updateData = {
      name: 'Updated Model',
      description: 'Updated Description',
    };

    it('should update a model', async () => {
      const mockUpdatedModel = {
        id: '1',
        ...updateData,
        status: ModelStatus.DRAFT,
      };

      modelService.updateModel.mockResolvedValue(mockUpdatedModel);

      const response = await request(app)
        .put('/models/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedModel);
      expect(modelService.updateModel).toHaveBeenCalledWith('1', updateData);
    });

    it('should return 404 for non-existent model', async () => {
      modelService.updateModel.mockResolvedValue(null);

      await request(app)
        .put('/models/999')
        .send(updateData)
        .expect(404);

      expect(modelService.updateModel).toHaveBeenCalledWith('999', updateData);
    });
  });

  describe('DELETE /models/:id', () => {
    it('should delete a model', async () => {
      modelService.deleteModel.mockResolvedValue({ id: '1' });

      await request(app)
        .delete('/models/1')
        .expect(200);

      expect(modelService.deleteModel).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent model', async () => {
      modelService.deleteModel.mockResolvedValue(null);

      await request(app)
        .delete('/models/999')
        .expect(404);

      expect(modelService.deleteModel).toHaveBeenCalledWith('999');
    });
  });
});
