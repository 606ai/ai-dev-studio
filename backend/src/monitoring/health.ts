import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import amqp from 'amqplib';
import logger from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  details: {
    database: {
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
    };
    cache: {
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
    };
    queue: {
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
    };
  };
}

class HealthService {
  private static instance: HealthService;
  private prisma: PrismaClient;
  private redis: Redis;
  private rabbitmqUrl: string;

  private constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || '');
    this.rabbitmqUrl = process.env.RABBITMQ_URL || '';
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  public async checkHealth(): Promise<HealthStatus> {
    const [dbHealth, cacheHealth, queueHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkQueue(),
    ]);

    const status: HealthStatus = {
      status: 'healthy',
      details: {
        database: dbHealth,
        cache: cacheHealth,
        queue: queueHealth,
      },
    };

    if (Object.values(status.details).some(s => s.status === 'unhealthy')) {
      status.status = 'unhealthy';
    }

    return status;
  }

  private async checkDatabase(): Promise<HealthStatus['details']['database']> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private async checkCache(): Promise<HealthStatus['details']['cache']> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private async checkQueue(): Promise<HealthStatus['details']['queue']> {
    const start = Date.now();
    try {
      const connection = await amqp.connect(this.rabbitmqUrl);
      await connection.close();
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      logger.error('Queue health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}

export default HealthService;
