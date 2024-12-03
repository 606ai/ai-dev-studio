import { Counter, Gauge, Histogram } from 'prom-client';
import logger from '../utils/logger';

class MetricsService {
  private static instance: MetricsService;
  
  // API Metrics
  private requestCounter: Counter;
  private requestDurationHistogram: Histogram;
  private activeConnections: Gauge;

  // Model Metrics
  private modelTrainingDuration: Histogram;
  private modelDeploymentCount: Counter;
  private activeDeployments: Gauge;

  // Worker Metrics
  private jobProcessingDuration: Histogram;
  private jobQueueSize: Gauge;
  private failedJobs: Counter;

  private constructor() {
    this.initializeMetrics();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private initializeMetrics() {
    try {
      // API Metrics
      this.requestCounter = new Counter({
        name: 'api_requests_total',
        help: 'Total number of API requests',
        labelNames: ['method', 'endpoint', 'status'],
      });

      this.requestDurationHistogram = new Histogram({
        name: 'api_request_duration_seconds',
        help: 'API request duration in seconds',
        labelNames: ['method', 'endpoint'],
        buckets: [0.1, 0.5, 1, 2, 5],
      });

      this.activeConnections = new Gauge({
        name: 'websocket_active_connections',
        help: 'Number of active WebSocket connections',
      });

      // Model Metrics
      this.modelTrainingDuration = new Histogram({
        name: 'model_training_duration_seconds',
        help: 'Model training duration in seconds',
        labelNames: ['model_id', 'version'],
        buckets: [10, 30, 60, 120, 300, 600],
      });

      this.modelDeploymentCount = new Counter({
        name: 'model_deployments_total',
        help: 'Total number of model deployments',
        labelNames: ['model_id', 'environment'],
      });

      this.activeDeployments = new Gauge({
        name: 'active_deployments',
        help: 'Number of active model deployments',
        labelNames: ['environment'],
      });

      // Worker Metrics
      this.jobProcessingDuration = new Histogram({
        name: 'job_processing_duration_seconds',
        help: 'Job processing duration in seconds',
        labelNames: ['queue', 'type'],
        buckets: [1, 5, 10, 30, 60],
      });

      this.jobQueueSize = new Gauge({
        name: 'job_queue_size',
        help: 'Current size of job queues',
        labelNames: ['queue'],
      });

      this.failedJobs = new Counter({
        name: 'failed_jobs_total',
        help: 'Total number of failed jobs',
        labelNames: ['queue', 'type'],
      });

    } catch (error) {
      logger.error('Failed to initialize metrics:', error);
    }
  }

  // API Metrics Methods
  public incrementRequestCount(method: string, endpoint: string, status: number) {
    this.requestCounter.labels(method, endpoint, status.toString()).inc();
  }

  public observeRequestDuration(method: string, endpoint: string, duration: number) {
    this.requestDurationHistogram.labels(method, endpoint).observe(duration);
  }

  public setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  // Model Metrics Methods
  public observeModelTrainingDuration(modelId: string, version: string, duration: number) {
    this.modelTrainingDuration.labels(modelId, version).observe(duration);
  }

  public incrementModelDeployment(modelId: string, environment: string) {
    this.modelDeploymentCount.labels(modelId, environment).inc();
  }

  public setActiveDeployments(environment: string, count: number) {
    this.activeDeployments.labels(environment).set(count);
  }

  // Worker Metrics Methods
  public observeJobProcessingDuration(queue: string, type: string, duration: number) {
    this.jobProcessingDuration.labels(queue, type).observe(duration);
  }

  public setJobQueueSize(queue: string, size: number) {
    this.jobQueueSize.labels(queue).set(size);
  }

  public incrementFailedJobs(queue: string, type: string) {
    this.failedJobs.labels(queue, type).inc();
  }
}

export default MetricsService;
