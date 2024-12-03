import { EventEmitter } from 'events';
import ApiGateway from '../gateway/ApiGateway';

export interface AutoMLConfig {
  objective: 'accuracy' | 'latency' | 'size';
  maxTrials: number;
  maxTime: number;
  architecture: {
    searchSpace: string[];
    constraints: {
      maxParameters?: number;
      maxLayers?: number;
      deviceTarget?: string;
    };
  };
  hyperparameters: {
    learningRate: {
      min: number;
      max: number;
    };
    batchSize: {
      values: number[];
    };
    optimizer: {
      values: string[];
    };
  };
  dataset: {
    id: string;
    validationSplit: number;
  };
}

export interface AutoMLTrial {
  id: string;
  architecture: string;
  hyperparameters: Record<string, any>;
  metrics: {
    accuracy: number;
    loss: number;
    latency: number;
    parameters: number;
  };
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface AutoMLJob {
  id: string;
  config: AutoMLConfig;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  trials: AutoMLTrial[];
  bestTrial?: AutoMLTrial;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

class AutoMLService extends EventEmitter {
  private static instance: AutoMLService;
  private api: ApiGateway;
  private jobs: Map<string, AutoMLJob>;
  private wsConnection: WebSocket | null;

  private constructor() {
    super();
    this.api = ApiGateway.getInstance();
    this.jobs = new Map();
    this.wsConnection = null;
    this.initializeWebSocket();
  }

  public static getInstance(): AutoMLService {
    if (!AutoMLService.instance) {
      AutoMLService.instance = new AutoMLService();
    }
    return AutoMLService.instance;
  }

  private initializeWebSocket() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'AUTOML_JOB_UPDATED':
          this.handleJobUpdate(data.payload);
          break;
        case 'AUTOML_TRIAL_COMPLETED':
          this.handleTrialCompleted(data.payload);
          break;
      }
    };

    this.wsConnection.onclose = () => {
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  private handleJobUpdate(job: AutoMLJob) {
    this.jobs.set(job.id, job);
    this.emit('jobUpdated', job);
  }

  private handleTrialCompleted(trial: AutoMLTrial) {
    this.emit('trialCompleted', trial);
  }

  public async startAutoML(config: AutoMLConfig): Promise<AutoMLJob> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.startAutoML(config);
      const job = response.data;
      this.jobs.set(job.id, job);
      return job;
    });
  }

  public async getJob(jobId: string): Promise<AutoMLJob> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.getAutoMLStatus(jobId);
      const job = response.data;
      this.jobs.set(job.id, job);
      return job;
    });
  }

  public async stopJob(jobId: string): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/automl/${jobId}/stop`);
    });
  }

  public async getTrials(jobId: string): Promise<AutoMLTrial[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get(`/automl/${jobId}/trials`);
      return response.data;
    });
  }

  public async exportModel(
    jobId: string,
    trialId: string,
    format: string
  ): Promise<Blob> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get(
        `/automl/${jobId}/trials/${trialId}/export/${format}`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    });
  }

  public subscribeToJobUpdates(
    jobId: string,
    callback: (job: AutoMLJob) => void
  ): () => void {
    const handler = (job: AutoMLJob) => {
      if (job.id === jobId) {
        callback(job);
      }
    };
    this.on('jobUpdated', handler);
    return () => this.off('jobUpdated', handler);
  }

  public subscribeToTrialUpdates(
    jobId: string,
    callback: (trial: AutoMLTrial) => void
  ): () => void {
    const handler = (trial: AutoMLTrial) => {
      if (trial.id.startsWith(jobId)) {
        callback(trial);
      }
    };
    this.on('trialCompleted', handler);
    return () => this.off('trialCompleted', handler);
  }

  public async getSearchSpace(): Promise<any> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get('/automl/search-space');
      return response.data;
    });
  }

  public async getParetoFrontier(jobId: string): Promise<any[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get(
        `/automl/${jobId}/pareto-frontier`
      );
      return response.data;
    });
  }

  public dispose() {
    this.wsConnection?.close();
    this.removeAllListeners();
  }
}

export default AutoMLService;
