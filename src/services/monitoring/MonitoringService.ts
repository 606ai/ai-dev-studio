import { EventEmitter } from 'events';
import ApiGateway from '../gateway/ApiGateway';

export interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
    cores: number[];
  };
  memory: {
    used: number;
    total: number;
    swap: number;
  };
  gpu?: Array<{
    id: string;
    usage: number;
    memory: {
      used: number;
      total: number;
    };
    temperature: number;
  }>;
  disk: {
    read: number;
    write: number;
    usage: number;
  };
  network: {
    rx: number;
    tx: number;
    connections: number;
  };
}

export interface ModelMetrics {
  inference: {
    latency: {
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: number;
    errors: number;
  };
  resource: {
    cpu: number;
    memory: number;
    gpu?: number;
  };
  accuracy: {
    overall: number;
    perClass?: Record<string, number>;
  };
  predictions: number;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  metrics?: Record<string, number>;
}

class MonitoringService extends EventEmitter {
  private static instance: MonitoringService;
  private api: ApiGateway;
  private wsConnection: WebSocket | null;
  private alerts: Map<string, Alert>;
  private metricsBuffer: Map<string, any[]>;

  private constructor() {
    super();
    this.api = ApiGateway.getInstance();
    this.wsConnection = null;
    this.alerts = new Map();
    this.metricsBuffer = new Map();
    this.initializeWebSocket();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeWebSocket() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'SYSTEM_METRICS':
          this.handleSystemMetrics(data.payload);
          break;
        case 'MODEL_METRICS':
          this.handleModelMetrics(data.payload);
          break;
        case 'ALERT':
          this.handleAlert(data.payload);
          break;
      }
    };

    this.wsConnection.onclose = () => {
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  private handleSystemMetrics(metrics: SystemMetrics) {
    this.emit('systemMetrics', metrics);
    this.bufferMetrics('system', metrics);
  }

  private handleModelMetrics(data: {
    modelId: string;
    metrics: ModelMetrics;
  }) {
    this.emit('modelMetrics', data);
    this.bufferMetrics(`model_${data.modelId}`, data.metrics);
  }

  private handleAlert(alert: Alert) {
    this.alerts.set(alert.id, alert);
    this.emit('alert', alert);
  }

  private bufferMetrics(key: string, metrics: any) {
    const buffer = this.metricsBuffer.get(key) || [];
    buffer.push({ ...metrics, timestamp: new Date() });
    if (buffer.length > 1000) {
      buffer.shift();
    }
    this.metricsBuffer.set(key, buffer);
  }

  public async getSystemMetrics(
    timeRange: string
  ): Promise<Array<SystemMetrics & { timestamp: Date }>> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.getSystemMetrics(timeRange);
      return response.data;
    });
  }

  public async getModelMetrics(
    modelId: string,
    timeRange: string
  ): Promise<Array<ModelMetrics & { timestamp: Date }>> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.getModelMetrics(modelId, timeRange);
      return response.data;
    });
  }

  public async getAlerts(options: {
    status?: 'active' | 'acknowledged' | 'resolved';
    type?: 'error' | 'warning' | 'info';
    startTime?: Date;
    endTime?: Date;
  }): Promise<Alert[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.get('/monitoring/alerts', {
        params: options,
      });
      const alerts = response.data;
      alerts.forEach((alert: Alert) => this.alerts.set(alert.id, alert));
      return alerts;
    });
  }

  public async acknowledgeAlert(alertId: string): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/monitoring/alerts/${alertId}/acknowledge`);
      const alert = this.alerts.get(alertId);
      if (alert) {
        alert.status = 'acknowledged';
        this.handleAlert(alert);
      }
    });
  }

  public async resolveAlert(alertId: string, resolution?: string): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/monitoring/alerts/${alertId}/resolve`, {
        resolution,
      });
      const alert = this.alerts.get(alertId);
      if (alert) {
        alert.status = 'resolved';
        this.handleAlert(alert);
      }
    });
  }

  public async setAlertThreshold(
    metric: string,
    threshold: number,
    condition: '>' | '<' | '==' | '>=' | '<='
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post('/monitoring/thresholds', {
        metric,
        threshold,
        condition,
      });
    });
  }

  public subscribeToSystemMetrics(
    callback: (metrics: SystemMetrics) => void
  ): () => void {
    this.on('systemMetrics', callback);
    return () => this.off('systemMetrics', callback);
  }

  public subscribeToModelMetrics(
    modelId: string,
    callback: (metrics: ModelMetrics) => void
  ): () => void {
    const handler = (data: { modelId: string; metrics: ModelMetrics }) => {
      if (data.modelId === modelId) {
        callback(data.metrics);
      }
    };
    this.on('modelMetrics', handler);
    return () => this.off('modelMetrics', handler);
  }

  public subscribeToAlerts(callback: (alert: Alert) => void): () => void {
    this.on('alert', callback);
    return () => this.off('alert', callback);
  }

  public getBufferedMetrics(
    key: string,
    duration: number
  ): Array<any & { timestamp: Date }> {
    const buffer = this.metricsBuffer.get(key) || [];
    const cutoff = new Date(Date.now() - duration);
    return buffer.filter((item) => item.timestamp >= cutoff);
  }

  public dispose() {
    this.wsConnection?.close();
    this.removeAllListeners();
    this.metricsBuffer.clear();
  }
}

export default MonitoringService;
