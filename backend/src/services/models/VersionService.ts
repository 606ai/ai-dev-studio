import { ModelVersion, VersionStatus } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import CacheService from '../cache';
import QueueService from '../queue';
import WebSocketService from '../websocket';
import logger from '../../utils/logger';

export interface CreateVersionInput {
  modelId: string;
  version: string;
  artifacts: Record<string, any>;
}

class VersionService {
  private static instance: VersionService;
  private prisma: PrismaClient;
  private cache: ReturnType<typeof CacheService.getInstance>;
  private queue: ReturnType<typeof QueueService.getInstance>;
  private ws: ReturnType<typeof WebSocketService.getInstance>;

  private constructor() {
    this.prisma = new PrismaClient();
    this.cache = CacheService.getInstance();
    this.queue = QueueService.getInstance();
    this.ws = WebSocketService.getInstance();
  }

  public static getInstance(): VersionService {
    if (!VersionService.instance) {
      VersionService.instance = new VersionService();
    }
    return VersionService.instance;
  }

  async createVersion(input: CreateVersionInput): Promise<ModelVersion> {
    const version = await this.prisma.modelVersion.create({
      data: {
        modelId: input.modelId,
        version: input.version,
        artifacts: input.artifacts,
        status: VersionStatus.CREATED,
      },
      include: {
        model: true,
      },
    });

    logger.info(`Created version ${version.id} for model ${version.modelId}`);
    this.ws.broadcastVersionStatus(version.modelId, {
      modelId: version.modelId,
      versionId: version.id,
      status: version.status,
    });

    return version;
  }

  async getVersion(id: string): Promise<ModelVersion | null> {
    const cacheKey = `version:${id}`;
    const cached = await this.cache.get<ModelVersion>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const version = await this.prisma.modelVersion.findUnique({
      where: { id },
      include: {
        model: true,
      },
    });

    if (version) {
      await this.cache.set(cacheKey, version, { ttl: 3600 });
    }

    return version;
  }

  async updateVersionStatus(id: string, status: VersionStatus): Promise<ModelVersion> {
    const version = await this.prisma.modelVersion.update({
      where: { id },
      data: { status },
      include: {
        model: true,
      },
    });

    const cacheKey = `version:${id}`;
    await this.cache.delete(cacheKey);

    logger.info(`Updated version ${id} status to ${status}`);
    this.ws.broadcastVersionStatus(version.modelId, {
      modelId: version.modelId,
      versionId: version.id,
      status: version.status,
    });

    return version;
  }

  async updateVersionMetrics(id: string, metrics: Record<string, number>): Promise<ModelVersion> {
    const version = await this.prisma.modelVersion.update({
      where: { id },
      data: { metrics },
      include: {
        model: true,
      },
    });

    const cacheKey = `version:${id}`;
    await this.cache.delete(cacheKey);

    logger.info(`Updated version ${id} metrics`);

    return version;
  }

  async listModelVersions(modelId: string): Promise<ModelVersion[]> {
    return this.prisma.modelVersion.findMany({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
      include: {
        model: true,
      },
    });
  }
}

export default VersionService;
