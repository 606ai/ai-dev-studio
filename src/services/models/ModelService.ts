import { EventEmitter } from 'events';
import ApiGateway from '../gateway/ApiGateway';

export interface Model {
  id: string;
  name: string;
  description: string;
  framework: string;
  architecture: string;
  status: 'training' | 'deployed' | 'stopped';
  metrics: {
    accuracy: number;
    loss: number;
    parameters: number;
    size: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingConfig {
  batchSize: number;
  epochs: number;
  learningRate: number;
  optimizer: string;
  datasetId: string;
}

class ModelService extends EventEmitter {
  private static instance: ModelService;
  private api: ApiGateway;
  private models: Map<string, Model>;
  private wsConnection: WebSocket | null;

  private constructor() {
    super();
    this.api = ApiGateway.getInstance();
    this.models = new Map();
    this.wsConnection = null;
    this.initializeWebSocket();
  }

  public static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  private initializeWebSocket() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'MODEL_UPDATED':
          this.handleModelUpdate(data.payload);
          break;
        case 'TRAINING_METRICS':
          this.handleTrainingMetrics(data.payload);
          break;
        case 'DEPLOYMENT_STATUS':
          this.handleDeploymentStatus(data.payload);
          break;
      }
    };

    this.wsConnection.onclose = () => {
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  private handleModelUpdate(model: Model) {
    this.models.set(model.id, model);
    this.emit('modelUpdated', model);
  }

  private handleTrainingMetrics(metrics: any) {
    this.emit('trainingMetrics', metrics);
  }

  private handleDeploymentStatus(status: any) {
    this.emit('deploymentStatus', status);
  }

  public async getModels(): Promise<Model[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.getModels();
      const models = response.data;
      models.forEach((model: Model) => this.models.set(model.id, model));
      return models;
    });
  }

  public async createModel(modelData: Partial<Model>): Promise<Model> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.createModel(modelData);
      const model = response.data;
      this.models.set(model.id, model);
      return model;
    });
  }

  public async startTraining(
    modelId: string,
    config: TrainingConfig
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.startTraining(modelId, config);
      const model = this.models.get(modelId);
      if (model) {
        model.status = 'training';
        this.handleModelUpdate(model);
      }
    });
  }

  public async stopTraining(modelId: string): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.stopTraining(modelId);
      const model = this.models.get(modelId);
      if (model) {
        model.status = 'stopped';
        this.handleModelUpdate(model);
      }
    });
  }

  public async deployModel(
    modelId: string,
    deploymentConfig: any
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.deployModel(modelId, deploymentConfig);
      const model = this.models.get(modelId);
      if (model) {
        model.status = 'deployed';
        this.handleModelUpdate(model);
      }
    });
  }

  public async exportModel(modelId: string, format: string): Promise<Blob> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get(
        `/models/${modelId}/export/${format}`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    });
  }

  public async getModelArchitecture(modelId: string): Promise<any> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get(
        `/models/${modelId}/architecture`
      );
      return response.data;
    });
  }

  public async compareModels(modelIds: string[]): Promise<any> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post('/models/compare', {
        modelIds,
      });
      return response.data;
    });
  }

  public async optimizeModel(modelId: string, config: any): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/models/${modelId}/optimize`, config);
    });
  }

  public subscribeToModelUpdates(
    modelId: string,
    callback: (model: Model) => void
  ): () => void {
    const handler = (model: Model) => {
      if (model.id === modelId) {
        callback(model);
      }
    };
    this.on('modelUpdated', handler);
    return () => this.off('modelUpdated', handler);
  }

  public subscribeToTrainingMetrics(
    modelId: string,
    callback: (metrics: any) => void
  ): () => void {
    const handler = (metrics: any) => {
      if (metrics.modelId === modelId) {
        callback(metrics);
      }
    };
    this.on('trainingMetrics', handler);
    return () => this.off('trainingMetrics', handler);
  }

  public dispose() {
    this.wsConnection?.close();
    this.removeAllListeners();
  }
}

export default ModelService;
