import { EventEmitter } from 'events';
import ApiGateway from '../gateway/ApiGateway';

export interface DeploymentConfig {
  target: 'cloud' | 'edge' | 'mobile' | 'browser';
  runtime: string;
  version: string;
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetCPUUtilization: number;
  };
  resources: {
    cpu: string;
    memory: string;
    gpu?: string;
  };
  environment: Record<string, string>;
  endpoints: {
    predict: string;
    metrics: string;
    health: string;
  };
}

export interface DeploymentMetrics {
  requests: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  memory: {
    used: number;
    total: number;
  };
  cpu: {
    used: number;
    total: number;
  };
  gpu?: {
    used: number;
    total: number;
  };
  instances: number;
  uptime: number;
  errors: number;
}

export interface Deployment {
  id: string;
  modelId: string;
  config: DeploymentConfig;
  status: 'deploying' | 'running' | 'failed' | 'stopped';
  metrics: DeploymentMetrics;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

class DeploymentService extends EventEmitter {
  private static instance: DeploymentService;
  private api: ApiGateway;
  private deployments: Map<string, Deployment>;
  private wsConnection: WebSocket | null;

  private constructor() {
    super();
    this.api = ApiGateway.getInstance();
    this.deployments = new Map();
    this.wsConnection = null;
    this.initializeWebSocket();
  }

  public static getInstance(): DeploymentService {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  private initializeWebSocket() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'DEPLOYMENT_UPDATED':
          this.handleDeploymentUpdate(data.payload);
          break;
        case 'METRICS_UPDATED':
          this.handleMetricsUpdate(data.payload);
          break;
      }
    };

    this.wsConnection.onclose = () => {
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  private handleDeploymentUpdate(deployment: Deployment) {
    this.deployments.set(deployment.id, deployment);
    this.emit('deploymentUpdated', deployment);
  }

  private handleMetricsUpdate(metrics: {
    deploymentId: string;
    metrics: DeploymentMetrics;
  }) {
    const deployment = this.deployments.get(metrics.deploymentId);
    if (deployment) {
      deployment.metrics = metrics.metrics;
      this.handleDeploymentUpdate(deployment);
    }
  }

  public async getDeployments(): Promise<Deployment[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.getDeployments();
      const deployments = response.data;
      deployments.forEach((deployment: Deployment) =>
        this.deployments.set(deployment.id, deployment)
      );
      return deployments;
    });
  }

  public async deployModel(
    modelId: string,
    config: DeploymentConfig
  ): Promise<Deployment> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.deployModel(modelId, config);
      const deployment = response.data;
      this.deployments.set(deployment.id, deployment);
      return deployment;
    });
  }

  public async stopDeployment(deploymentId: string): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/deployment/${deploymentId}/stop`);
    });
  }

  public async scaleDeployment(
    deploymentId: string,
    instances: number
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/deployment/${deploymentId}/scale`, {
        instances,
      });
    });
  }

  public async updateConfig(
    deploymentId: string,
    config: Partial<DeploymentConfig>
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.updateDeployment(deploymentId, config);
    });
  }

  public async getLogs(
    deploymentId: string,
    options: {
      start: Date;
      end: Date;
      limit: number;
      filter?: string;
    }
  ): Promise<string[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get(
        `/deployment/${deploymentId}/logs`,
        {
          params: options,
        }
      );
      return response.data;
    });
  }

  public async getMetrics(
    deploymentId: string,
    timeRange: string
  ): Promise<DeploymentMetrics[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get(
        `/deployment/${deploymentId}/metrics`,
        {
          params: { timeRange },
        }
      );
      return response.data;
    });
  }

  public subscribeToDeploymentUpdates(
    deploymentId: string,
    callback: (deployment: Deployment) => void
  ): () => void {
    const handler = (deployment: Deployment) => {
      if (deployment.id === deploymentId) {
        callback(deployment);
      }
    };
    this.on('deploymentUpdated', handler);
    return () => this.off('deploymentUpdated', handler);
  }

  public async testEndpoint(
    deploymentId: string,
    input: any
  ): Promise<{ output: any; latency: number }> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post(
        `/deployment/${deploymentId}/test`,
        input
      );
      return response.data;
    });
  }

  public dispose() {
    this.wsConnection?.close();
    this.removeAllListeners();
  }
}

export default DeploymentService;
