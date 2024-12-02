import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import storageConfig from '../config/storage';

export interface StorageItem {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
  url?: string;
}

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadMultipleFiles(files: File[], basePath: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => {
        const path = `${basePath}/${file.name}`;
        return this.uploadFile(file, path);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw new Error('Failed to upload multiple files');
    }
  }

  async listFiles(path: string): Promise<StorageItem[]> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);

      const filePromises = result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        const metadata = await item.getMetadata();

        return {
          name: item.name,
          path: item.fullPath,
          size: metadata.size,
          type: metadata.contentType || 'unknown',
          lastModified: new Date(metadata.timeCreated),
          url,
        };
      });

      return await Promise.all(filePromises);
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async deleteMultipleFiles(paths: string[]): Promise<void> {
    try {
      const deletePromises = paths.map(path => this.deleteFile(path));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw new Error('Failed to delete multiple files');
    }
  }

  async createBackup(files: File[], timestamp: string): Promise<string[]> {
    const backupPath = `backups/${timestamp}`;
    return await this.uploadMultipleFiles(files, backupPath);
  }

  async listBackups(): Promise<{ timestamp: string; files: StorageItem[] }[]> {
    try {
      const backupsRef = ref(storage, 'backups');
      const backups = await listAll(backupsRef);

      const backupPromises = backups.prefixes.map(async (backupRef) => {
        const files = await this.listFiles(backupRef.fullPath);
        return {
          timestamp: backupRef.name,
          files,
        };
      });

      return await Promise.all(backupPromises);
    } catch (error) {
      console.error('Error listing backups:', error);
      throw new Error('Failed to list backups');
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const now = new Date();
      const retentionPeriod = storageConfig.backupRetentionDays * 24 * 60 * 60 * 1000;

      const oldBackups = backups.filter(backup => {
        const backupDate = new Date(backup.timestamp);
        return now.getTime() - backupDate.getTime() > retentionPeriod;
      });

      for (const backup of oldBackups) {
        const paths = backup.files.map(file => file.path);
        await this.deleteMultipleFiles(paths);
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      throw new Error('Failed to cleanup old backups');
    }
  }

  async getStorageStats(): Promise<{
    totalSize: number;
    usedSize: number;
    fileCount: number;
    backupCount: number;
  }> {
    try {
      const allFiles = await this.listFiles('');
      const backups = await this.listBackups();

      return {
        totalSize: allFiles.reduce((sum, file) => sum + file.size, 0),
        usedSize: allFiles.reduce((sum, file) => sum + file.size, 0),
        fileCount: allFiles.length,
        backupCount: backups.length,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error('Failed to get storage stats');
    }
  }
}

export const storageService = StorageService.getInstance();
