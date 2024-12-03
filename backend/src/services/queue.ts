import amqp, { Channel, Connection } from 'amqplib';
import config from '../config';
import logger from '../utils/logger';

class QueueService {
  private static instance: QueueService;
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  private constructor() {}

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Handle connection events
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.reconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.reconnect();
      });

      // Setup queues
      await this.setupQueues();

      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    // Model Training Queue
    await this.channel.assertQueue('model.training', {
      durable: true,
      deadLetterExchange: 'dlx',
    });

    // Model Deployment Queue
    await this.channel.assertQueue('model.deployment', {
      durable: true,
      deadLetterExchange: 'dlx',
    });

    // Code Analysis Queue
    await this.channel.assertQueue('code.analysis', {
      durable: true,
      deadLetterExchange: 'dlx',
    });

    // Notifications Queue
    await this.channel.assertQueue('notifications', {
      durable: true,
      deadLetterExchange: 'dlx',
    });

    // Dead Letter Exchange
    await this.channel.assertExchange('dlx', 'direct');
    await this.channel.assertQueue('dead.letter.queue');
    await this.channel.bindQueue('dead.letter.queue', 'dlx', '');
  }

  private async reconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
      } catch (error) {
        logger.error('Error closing existing connection:', error);
      }
    }

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('Failed to reconnect to RabbitMQ:', error);
      }
    }, 5000);
  }

  public async publishMessage(
    queue: string,
    message: any,
    options?: amqp.Options.Publish
  ): Promise<boolean> {
    if (!this.channel) throw new Error('Channel not initialized');

    try {
      const success = this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          ...options,
        }
      );

      return success;
    } catch (error) {
      logger.error(`Failed to publish message to queue ${queue}:`, error);
      throw error;
    }
  }

  public async consumeMessages(
    queue: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    try {
      await this.channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content);
            this.channel?.ack(msg);
          } catch (error) {
            logger.error(`Error processing message from queue ${queue}:`, error);
            this.channel?.nack(msg, false, false);
          }
        },
        {
          noAck: false,
        }
      );

      logger.info(`Started consuming messages from queue: ${queue}`);
    } catch (error) {
      logger.error(`Failed to start consuming messages from queue ${queue}:`, error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('Closed RabbitMQ connection');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }
}

export default QueueService;
