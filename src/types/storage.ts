// Storage Event Types
export type StorageEventType =
  | 'FileUpload'
  | 'FileDelete'
  | 'BackupCreated'
  | 'BackupFailed'
  | 'SyncStarted'
  | 'SyncCompleted'
  | 'SyncFailed'
  | 'HealthCheck'
  | 'SpaceWarning'
  | 'Error';

export interface StorageEvent {
  type: StorageEventType;
  details: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: string;
}

// Storage Metric Types
export type MetricUnit =
  | 'Bytes'
  | 'Count'
  | 'Seconds'
  | 'Percent'
  | 'Milliseconds'
  | 'Bytes/Second';

export interface StorageMetric {
  name: string;
  value: number;
  unit: MetricUnit;
  dimensions: Record<string, string | number>;
}

// Cloud Provider Types
export interface CloudProvider {
  name: string;
  type: 'firebase' | 'onedrive' | 'dropbox' | 'gdrive' | 'aws' | 's3';
  config: CloudProviderConfig;
  isEnabled: boolean;
  isConnected: boolean;
}

export interface CloudProviderConfig {
  credentials?: Record<string, string>;
  region?: string;
  bucket?: string;
  basePath?: string;
  options?: Record<string, any>;
}

// Sync Types
export interface SyncConfig {
  enabled: boolean;
  interval: number;
  providers: string[];
  directories: string[];
  excludePatterns: string[];
  maxFileSize: number;
  retryAttempts: number;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  failedAttempts: number;
  errors: Error[];
}

// Backup Types
export interface BackupConfig {
  enabled: boolean;
  schedule: string;
  retention: {
    days: number;
    maxBackups: number;
  };
  providers: string[];
  includePatterns: string[];
  excludePatterns: string[];
}

export interface BackupStatus {
  lastBackup: Date | null;
  nextBackup: Date | null;
  successfulBackups: number;
  failedBackups: number;
  errors: Error[];
}

// Storage Item Types
export interface StorageItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  metadata: Record<string, any>;
  providers: string[];
  syncStatus: 'synced' | 'pending' | 'failed';
  backupStatus: 'backed-up' | 'pending' | 'failed';
}

// Health Check Types
export interface StorageHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
  metrics: {
    diskSpace: {
      total: number;
      used: number;
      free: number;
      percentUsed: number;
    };
    backups: {
      total: number;
      successful: number;
      failed: number;
      lastBackup: Date | null;
    };
    sync: {
      activeProviders: number;
      pendingFiles: number;
      failedFiles: number;
      lastSync: Date | null;
    };
  };
}

// Error Types
export interface StorageError extends Error {
  code: string;
  context: Record<string, any>;
  timestamp: Date;
  isRetryable: boolean;
  attempts?: number;
}

// Analytics Types
export interface StorageAnalytics {
  period: 'day' | 'week' | 'month';
  metrics: {
    uploads: number;
    downloads: number;
    deletions: number;
    backups: number;
    syncs: number;
    errors: number;
  };
  usage: {
    current: number;
    peak: number;
    average: number;
    trend: number;
  };
  performance: {
    uploadSpeed: number;
    downloadSpeed: number;
    syncLatency: number;
    backupDuration: number;
  };
}
