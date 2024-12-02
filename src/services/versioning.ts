import { StorageItem } from '../types/storage';
import { monitoringService } from './monitoring';
import { storageService } from './storage';
import crypto from 'crypto';

interface Version {
  id: string;
  timestamp: Date;
  size: number;
  hash: string;
  metadata: Record<string, any>;
  provider: string;
  path: string;
}

interface VersionMetadata {
  versions: Version[];
  currentVersion: string;
  totalVersions: number;
  oldestVersion: Date;
  latestVersion: Date;
}

export class VersioningService {
  private static instance: VersioningService;
  private versionMap: Map<string, VersionMetadata>;
  private maxVersions: number;
  private retentionDays: number;

  private constructor() {
    this.versionMap = new Map();
    this.maxVersions = 100;
    this.retentionDays = 30;
  }

  static getInstance(): VersioningService {
    if (!VersioningService.instance) {
      VersioningService.instance = new VersioningService();
    }
    return VersioningService.instance;
  }

  async createVersion(
    item: StorageItem,
    content: Buffer,
    provider: string
  ): Promise<Version> {
    try {
      const hash = crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');

      const version: Version = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        size: content.length,
        hash,
        metadata: {
          originalName: item.name,
          mimeType: this.getMimeType(item.name),
          created: item.created,
          modified: item.modified,
        },
        provider,
        path: `versions/${item.id}/${hash}`,
      };

      // Store versioned content
      await storageService.uploadFile(
        provider,
        version.path,
        content
      );

      // Update version metadata
      await this.updateVersionMetadata(item.id, version);

      await monitoringService.logStorageEvent({
        type: 'FileUpload',
        details: {
          message: 'Version created',
          itemId: item.id,
          versionId: version.id,
        },
      });

      return version;
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Failed to create version',
          itemId: item.id,
          error,
        },
      });
      throw error;
    }
  }

  async getVersion(
    itemId: string,
    versionId: string
  ): Promise<{ version: Version; content: Buffer }> {
    try {
      const metadata = this.versionMap.get(itemId);
      if (!metadata) {
        throw new Error('Item not found');
      }

      const version = metadata.versions.find(v => v.id === versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      const content = await storageService.downloadFile(
        version.provider,
        version.path
      );

      return { version, content };
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Failed to get version',
          itemId,
          versionId,
          error,
        },
      });
      throw error;
    }
  }

  async listVersions(itemId: string): Promise<Version[]> {
    const metadata = this.versionMap.get(itemId);
    if (!metadata) {
      return [];
    }
    return metadata.versions;
  }

  async revertToVersion(
    itemId: string,
    versionId: string
  ): Promise<void> {
    try {
      const { version, content } = await this.getVersion(itemId, versionId);
      const item = await storageService.getItem(itemId);

      // Create new version of current state before reverting
      await this.createVersion(item, await storageService.downloadFile(
        item.providers[0],
        item.path
      ), item.providers[0]);

      // Restore version content
      await storageService.uploadFile(
        version.provider,
        item.path,
        content
      );

      await monitoringService.logStorageEvent({
        type: 'FileUpload',
        details: {
          message: 'Reverted to version',
          itemId,
          versionId,
        },
      });
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Failed to revert version',
          itemId,
          versionId,
          error,
        },
      });
      throw error;
    }
  }

  async deleteVersion(
    itemId: string,
    versionId: string
  ): Promise<void> {
    try {
      const metadata = this.versionMap.get(itemId);
      if (!metadata) {
        throw new Error('Item not found');
      }

      const version = metadata.versions.find(v => v.id === versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      // Don't allow deleting current version
      if (version.id === metadata.currentVersion) {
        throw new Error('Cannot delete current version');
      }

      // Delete version content
      await storageService.deleteFile(
        version.provider,
        version.path
      );

      // Update metadata
      metadata.versions = metadata.versions.filter(v => v.id !== versionId);
      metadata.totalVersions = metadata.versions.length;
      this.versionMap.set(itemId, metadata);

      await monitoringService.logStorageEvent({
        type: 'FileDelete',
        details: {
          message: 'Version deleted',
          itemId,
          versionId,
        },
      });
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Failed to delete version',
          itemId,
          versionId,
          error,
        },
      });
      throw error;
    }
  }

  async cleanupVersions(itemId: string): Promise<void> {
    try {
      const metadata = this.versionMap.get(itemId);
      if (!metadata) {
        return;
      }

      const now = new Date();
      const retentionDate = new Date(
        now.getTime() - this.retentionDays * 24 * 60 * 60 * 1000
      );

      // Sort versions by date, newest first
      const sortedVersions = [...metadata.versions].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      // Keep track of versions to delete
      const versionsToDelete: Version[] = [];

      // Process versions
      sortedVersions.forEach((version, index) => {
        // Skip current version
        if (version.id === metadata.currentVersion) {
          return;
        }

        // Delete if beyond max versions or retention period
        if (
          index >= this.maxVersions ||
          version.timestamp < retentionDate
        ) {
          versionsToDelete.push(version);
        }
      });

      // Delete old versions
      for (const version of versionsToDelete) {
        await this.deleteVersion(itemId, version.id);
      }

      await monitoringService.logStorageEvent({
        type: 'FileDelete',
        details: {
          message: 'Versions cleaned up',
          itemId,
          deletedCount: versionsToDelete.length,
        },
      });
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Failed to cleanup versions',
          itemId,
          error,
        },
      });
      throw error;
    }
  }

  private async updateVersionMetadata(
    itemId: string,
    newVersion: Version
  ): Promise<void> {
    const existing = this.versionMap.get(itemId) || {
      versions: [],
      currentVersion: '',
      totalVersions: 0,
      oldestVersion: new Date(),
      latestVersion: new Date(),
    };

    existing.versions.push(newVersion);
    existing.currentVersion = newVersion.id;
    existing.totalVersions = existing.versions.length;
    existing.latestVersion = new Date(Math.max(
      ...existing.versions.map(v => v.timestamp.getTime())
    ));
    existing.oldestVersion = new Date(Math.min(
      ...existing.versions.map(v => v.timestamp.getTime())
    ));

    this.versionMap.set(itemId, existing);
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      // Add more as needed
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

export const versioningService = VersioningService.getInstance();
