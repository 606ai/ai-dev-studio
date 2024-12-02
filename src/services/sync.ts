import { StorageItem, SyncConfig, SyncStatus, CloudProvider } from '../types/storage';
import { monitoringService } from './monitoring';
import { storageService } from './storage';
import debounce from 'lodash/debounce';
import chokidar from 'chokidar';
import path from 'path';
import crypto from 'crypto';

interface FileChange {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: Date;
}

interface SyncState {
  fileHashes: Map<string, string>;
  pendingChanges: Map<string, FileChange>;
  activeUploads: Set<string>;
  retryQueue: Map<string, { attempts: number; nextRetry: Date }>;
}

export class SyncService {
  private static instance: SyncService;
  private config: SyncConfig;
  private status: SyncStatus;
  private state: SyncState;
  private watchers: Map<string, chokidar.FSWatcher>;
  private providers: Map<string, CloudProvider>;

  private constructor() {
    this.config = {
      enabled: false,
      interval: 300,
      providers: [],
      directories: [],
      excludePatterns: [],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      retryAttempts: 3,
    };

    this.status = {
      isRunning: false,
      lastSync: null,
      nextSync: null,
      failedAttempts: 0,
      errors: [],
    };

    this.state = {
      fileHashes: new Map(),
      pendingChanges: new Map(),
      activeUploads: new Set(),
      retryQueue: new Map(),
    };

    this.watchers = new Map();
    this.providers = new Map();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize(config: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.setupProviders();
    await this.initializeWatchers();
    
    // Start retry mechanism
    setInterval(() => this.processRetryQueue(), 60000); // Check retry queue every minute
  }

  private async setupProviders(): Promise<void> {
    for (const providerName of this.config.providers) {
      try {
        const provider = await storageService.getCloudProvider(providerName);
        if (provider && provider.isEnabled) {
          this.providers.set(providerName, provider);
        }
      } catch (error) {
        await monitoringService.logStorageEvent({
          type: 'Error',
          details: {
            message: `Failed to setup provider: ${providerName}`,
            error,
          },
        });
      }
    }
  }

  private async initializeWatchers(): Promise<void> {
    for (const directory of this.config.directories) {
      const watcher = chokidar.watch(directory, {
        ignored: this.config.excludePatterns,
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100,
        },
      });

      watcher
        .on('add', (path) => this.handleFileChange('add', path))
        .on('change', (path) => this.handleFileChange('change', path))
        .on('unlink', (path) => this.handleFileChange('unlink', path));

      this.watchers.set(directory, watcher);
    }
  }

  private handleFileChange = debounce(async (
    type: FileChange['type'],
    filePath: string
  ): Promise<void> => {
    try {
      // Skip if file is being uploaded
      if (this.state.activeUploads.has(filePath)) {
        return;
      }

      const change: FileChange = {
        type,
        path: filePath,
        timestamp: new Date(),
      };

      // For new or modified files, calculate hash
      if (type !== 'unlink') {
        const hash = await this.calculateFileHash(filePath);
        
        // Skip if file hasn't actually changed
        if (this.state.fileHashes.get(filePath) === hash) {
          return;
        }

        this.state.fileHashes.set(filePath, hash);
      }

      this.state.pendingChanges.set(filePath, change);
      await this.processPendingChanges();

    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Failed to handle file change',
          filePath,
          type,
          error,
        },
      });
    }
  }, 1000);

  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await storageService.readFile(filePath);
      return crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');
    } catch (error) {
      throw new Error(`Failed to calculate file hash: ${error.message}`);
    }
  }

  private async processPendingChanges(): Promise<void> {
    if (!this.config.enabled || this.state.pendingChanges.size === 0) {
      return;
    }

    for (const [filePath, change] of this.state.pendingChanges.entries()) {
      try {
        this.state.activeUploads.add(filePath);
        await this.syncFile(filePath, change);
        this.state.pendingChanges.delete(filePath);
        
      } catch (error) {
        const retryInfo = this.state.retryQueue.get(filePath) || {
          attempts: 0,
          nextRetry: new Date(),
        };

        if (retryInfo.attempts < this.config.retryAttempts) {
          retryInfo.attempts++;
          retryInfo.nextRetry = new Date(
            Date.now() + Math.pow(2, retryInfo.attempts) * 1000
          );
          this.state.retryQueue.set(filePath, retryInfo);
        } else {
          await monitoringService.logStorageEvent({
            type: 'SyncFailed',
            details: {
              filePath,
              error,
              attempts: retryInfo.attempts,
            },
          });
        }
      } finally {
        this.state.activeUploads.delete(filePath);
      }
    }
  }

  private async syncFile(
    filePath: string,
    change: FileChange
  ): Promise<void> {
    const syncPromises = Array.from(this.providers.values()).map(
      async (provider) => {
        try {
          if (change.type === 'unlink') {
            await storageService.deleteFile(provider.name, filePath);
          } else {
            const content = await storageService.readFile(filePath);
            await storageService.uploadFile(provider.name, filePath, content);
          }
        } catch (error) {
          throw new Error(
            `Failed to sync with provider ${provider.name}: ${error.message}`
          );
        }
      }
    );

    await Promise.all(syncPromises);

    await monitoringService.logStorageEvent({
      type: 'SyncCompleted',
      details: {
        filePath,
        changeType: change.type,
        providers: Array.from(this.providers.keys()),
      },
    });
  }

  private async processRetryQueue(): Promise<void> {
    const now = new Date();
    
    for (const [filePath, retryInfo] of this.state.retryQueue.entries()) {
      if (retryInfo.nextRetry <= now) {
        this.state.pendingChanges.set(filePath, {
          type: 'change',
          path: filePath,
          timestamp: now,
        });
        this.state.retryQueue.delete(filePath);
      }
    }

    await this.processPendingChanges();
  }

  async stop(): Promise<void> {
    this.config.enabled = false;
    
    // Close all file watchers
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    this.watchers.clear();

    // Process any remaining changes
    await this.processPendingChanges();

    this.status.isRunning = false;
    await monitoringService.logStorageEvent({
      type: 'SyncCompleted',
      details: {
        message: 'Sync service stopped',
      },
    });
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }
}

export const syncService = SyncService.getInstance();
