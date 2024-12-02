import { createLogger, format, transports } from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import { MetricsLogger } from '@aws-sdk/client-cloudwatch';
import { StorageEvent, StorageMetric } from '../types/storage';

// Initialize Logtail for cloud logging
const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN || '');

// Create Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.metadata()
  ),
  transports: [
    // Console logging
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    }),
    // File logging
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // Cloud logging
    new LogtailTransport(logtail),
  ],
});

// Initialize CloudWatch metrics
const metricsLogger = new MetricsLogger({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export class MonitoringService {
  private static instance: MonitoringService;

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Log storage events
  async logStorageEvent(event: StorageEvent): Promise<void> {
    const { type, details, metadata } = event;
    
    logger.info(`Storage Event: ${type}`, {
      event: type,
      details,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // Send metrics to CloudWatch
    if (process.env.ENABLE_CLOUDWATCH === 'true') {
      await this.recordMetric({
        name: `StorageEvent_${type}`,
        value: 1,
        unit: 'Count',
        dimensions: metadata,
      });
    }
  }

  // Record storage metrics
  async recordMetric(metric: StorageMetric): Promise<void> {
    const { name, value, unit, dimensions } = metric;

    // Log metric locally
    logger.info(`Storage Metric: ${name}`, {
      metric: name,
      value,
      unit,
      dimensions,
      timestamp: new Date().toISOString(),
    });

    // Send to CloudWatch if enabled
    if (process.env.ENABLE_CLOUDWATCH === 'true') {
      try {
        await metricsLogger.putMetricData({
          Namespace: 'AIDevStudio/Storage',
          MetricData: [{
            MetricName: name,
            Value: value,
            Unit: unit,
            Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({
              Name,
              Value: String(Value),
            })),
            Timestamp: new Date(),
          }],
        });
      } catch (error) {
        logger.error('Failed to send metric to CloudWatch', {
          error,
          metric: name,
        });
      }
    }
  }

  // Monitor storage health
  async checkStorageHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Check disk space
      const diskSpace = await this.checkDiskSpace();
      if (diskSpace.percentUsed > 90) {
        status = 'unhealthy';
        issues.push('Critical: Disk space usage above 90%');
      } else if (diskSpace.percentUsed > 80) {
        status = 'degraded';
        issues.push('Warning: Disk space usage above 80%');
      }

      // Check backup status
      const backupStatus = await this.checkBackupStatus();
      if (!backupStatus.lastBackupSuccessful) {
        status = 'degraded';
        issues.push('Warning: Last backup failed');
      }
      if (backupStatus.daysSinceLastBackup > 7) {
        status = 'degraded';
        issues.push('Warning: No successful backup in the last 7 days');
      }

      // Check sync status
      const syncStatus = await this.checkSyncStatus();
      if (!syncStatus.isSyncing) {
        status = 'degraded';
        issues.push('Warning: File synchronization is not running');
      }
      if (syncStatus.failedSyncs > 0) {
        issues.push(`Warning: ${syncStatus.failedSyncs} failed sync attempts`);
      }

      // Log health check results
      await this.logStorageEvent({
        type: 'HealthCheck',
        details: { status, issues },
        metadata: {
          diskSpace,
          backupStatus,
          syncStatus,
        },
      });

      return { status, issues };
    } catch (error) {
      logger.error('Failed to check storage health', { error });
      return {
        status: 'unhealthy',
        issues: ['Error: Failed to complete health check'],
      };
    }
  }

  // Helper methods for health checks
  private async checkDiskSpace(): Promise<{
    total: number;
    used: number;
    free: number;
    percentUsed: number;
  }> {
    // Implementation depends on the platform (Node.js disk space checking)
    // This is a placeholder
    return {
      total: 0,
      used: 0,
      free: 0,
      percentUsed: 0,
    };
  }

  private async checkBackupStatus(): Promise<{
    lastBackupSuccessful: boolean;
    daysSinceLastBackup: number;
    failedBackups: number;
  }> {
    // Implementation to check backup status
    // This is a placeholder
    return {
      lastBackupSuccessful: true,
      daysSinceLastBackup: 0,
      failedBackups: 0,
    };
  }

  private async checkSyncStatus(): Promise<{
    isSyncing: boolean;
    failedSyncs: number;
    lastSyncTime: Date;
  }> {
    // Implementation to check sync status
    // This is a placeholder
    return {
      isSyncing: true,
      failedSyncs: 0,
      lastSyncTime: new Date(),
    };
  }
}

export const monitoringService = MonitoringService.getInstance();
