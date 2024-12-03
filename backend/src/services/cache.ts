import { createClient, RedisClientType } from 'redis';
import config from '../config';
import logger from '../utils/logger';

class CacheService {
  private static instance: CacheService;
  private client: RedisClientType;

  private constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
    });

    this.setupEventHandlers();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.client.on('reconnecting', () => {
      logger.info('Reconnecting to Redis');
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info('Disconnected from Redis');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting key ${key} from Redis:`, error);
      throw error;
    }
  }

  public async set(
    key: string,
    value: any,
    options?: { ttl?: number }
  ): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (options?.ttl) {
        await this.client.setEx(key, options.ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      logger.error(`Error setting key ${key} in Redis:`, error);
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Error deleting key ${key} from Redis:`, error);
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking existence of key ${key} in Redis:`, error);
      throw error;
    }
  }

  public async increment(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Error incrementing key ${key} in Redis:`, error);
      throw error;
    }
  }

  public async decrement(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      logger.error(`Error decrementing key ${key} in Redis:`, error);
      throw error;
    }
  }

  public async setHash(
    key: string,
    field: string,
    value: any
  ): Promise<void> {
    try {
      await this.client.hSet(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error(`Error setting hash field ${field} for key ${key} in Redis:`, error);
      throw error;
    }
  }

  public async getHash<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting hash field ${field} for key ${key} from Redis:`, error);
      throw error;
    }
  }

  public async getAllHash<T>(key: string): Promise<Record<string, T>> {
    try {
      const hash = await this.client.hGetAll(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting all hash fields for key ${key} from Redis:`, error);
      throw error;
    }
  }

  public async deleteHash(key: string, field: string): Promise<void> {
    try {
      await this.client.hDel(key, field);
    } catch (error) {
      logger.error(`Error deleting hash field ${field} for key ${key} from Redis:`, error);
      throw error;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      logger.error('Error clearing Redis cache:', error);
      throw error;
    }
  }
}

export default CacheService;
