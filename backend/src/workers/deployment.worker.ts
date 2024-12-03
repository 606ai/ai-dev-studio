import QueueService from '../services/queue';
import DeploymentService from '../services/deployment/DeploymentService';
import logger from '../utils/logger';

class DeploymentWorker {
  private queue: QueueService;
  private deploymentService: DeploymentService;

  constructor() {
    this.queue = QueueService.getInstance();
    this.deploymentService = DeploymentService.getInstance();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.queue.connect();
      await this.setupConsumers();
      logger.info('Deployment worker initialized');
    } catch (error) {
      logger.error('Failed to initialize deployment worker:', error);
      process.exit(1);
    }
  }

  private async setupConsumers() {
    // Handle deployment creation
    await this.queue.consumeMessages('deployment.create', async (message) => {
      const { deploymentId, config } = message;
      logger.info(`Processing deployment ${deploymentId}`);

      try {
        // Update status to running
        await this.deploymentService.updateDeploymentStatus(deploymentId, 'RUNNING');

        // Deploy the model
        const metrics = await this.deployModel(config);

        // Update deployment with metrics
        await this.deploymentService.updateDeploymentStatus(deploymentId, 'RUNNING', metrics);
        logger.info(`Deployment ${deploymentId} is running`);
      } catch (error) {
        logger.error(`Deployment ${deploymentId} failed:`, error);
        await this.deploymentService.updateDeploymentStatus(deploymentId, 'FAILED', {
          error: error.message,
        });
      }
    });

    // Handle deployment scaling
    await this.queue.consumeMessages('deployment.scale', async (message) => {
      const { deploymentId, replicas } = message;
      logger.info(`Scaling deployment ${deploymentId} to ${replicas} replicas`);

      try {
        await this.scaleDeployment(deploymentId, replicas);
        logger.info(`Successfully scaled deployment ${deploymentId}`);
      } catch (error) {
        logger.error(`Failed to scale deployment ${deploymentId}:`, error);
      }
    });

    // Handle deployment stopping
    await this.queue.consumeMessages('deployment.stop', async (message) => {
      const { deploymentId } = message;
      logger.info(`Stopping deployment ${deploymentId}`);

      try {
        await this.stopDeployment(deploymentId);
        await this.deploymentService.updateDeploymentStatus(deploymentId, 'STOPPED');
        logger.info(`Successfully stopped deployment ${deploymentId}`);
      } catch (error) {
        logger.error(`Failed to stop deployment ${deploymentId}:`, error);
      }
    });
  }

  private async deployModel(config: any): Promise<any> {
    // Simulate model deployment
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      endpoint: 'https://api.example.com/models/prediction',
      replicas: config.replicas || 1,
      status: 'healthy',
    };
  }

  private async scaleDeployment(deploymentId: string, replicas: number): Promise<void> {
    // Simulate scaling operation
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async stopDeployment(deploymentId: string): Promise<void> {
    // Simulate stopping operation
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Start worker
new DeploymentWorker();
