import QueueService from '../services/queue';
import ModelService from '../services/models/ModelService';
import logger from '../utils/logger';

class TrainingWorker {
  private queue: QueueService;
  private modelService: ModelService;

  constructor() {
    this.queue = QueueService.getInstance();
    this.modelService = ModelService.getInstance();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.queue.connect();
      await this.setupConsumers();
      logger.info('Training worker initialized');
    } catch (error) {
      logger.error('Failed to initialize training worker:', error);
      process.exit(1);
    }
  }

  private async setupConsumers() {
    await this.queue.consumeMessages('model.training', async (message) => {
      const { versionId, modelId, artifacts } = message;
      logger.info(`Processing training job for version ${versionId}`);

      try {
        // Update version status to training
        await this.modelService.updateVersionStatus(versionId, 'TRAINING');

        // Simulate training process
        const metrics = await this.trainModel(artifacts);

        // Update version with results
        await this.modelService.updateVersionStatus(versionId, 'READY', metrics);
        logger.info(`Training completed for version ${versionId}`);
      } catch (error) {
        logger.error(`Training failed for version ${versionId}:`, error);
        await this.modelService.updateVersionStatus(versionId, 'FAILED', {
          error: error.message,
        });
      }
    });
  }

  private async trainModel(artifacts: any): Promise<any> {
    // Simulate model training
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return {
      accuracy: 0.95,
      loss: 0.05,
      epochs: 100,
      trainingTime: 300,
    };
  }
}

// Start worker
new TrainingWorker();
