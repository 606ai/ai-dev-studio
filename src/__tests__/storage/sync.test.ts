import { SyncService } from '../../services/sync';
import { monitoringService } from '../../services/monitoring';
import { storageService } from '../../services/storage';
import { SyncConfig } from '../../types/storage';
import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
jest.mock('../../services/monitoring');
jest.mock('../../services/storage');
jest.mock('fs/promises');
jest.mock('chokidar');

describe('Sync Service', () => {
  let syncService: SyncService;
  const testConfig: SyncConfig = {
    enabled: true,
    interval: 300,
    providers: ['aws', 'dropbox'],
    directories: ['/test/dir'],
    excludePatterns: ['*.tmp'],
    maxFileSize: 100 * 1024 * 1024,
    retryAttempts: 3,
  };

  beforeEach(() => {
    syncService = SyncService.getInstance();
  });

  afterEach(async () => {
    await syncService.stop();
  });

  describe('Initialization', () => {
    it('should initialize with config', async () => {
      await syncService.initialize(testConfig);
      expect(syncService.getConfig()).toEqual(testConfig);
    });

    it('should setup providers', async () => {
      await syncService.initialize(testConfig);
      // Verify providers were initialized
      expect(storageService.getCloudProvider).toHaveBeenCalledWith('aws');
      expect(storageService.getCloudProvider).toHaveBeenCalledWith('dropbox');
    });
  });

  describe('File Watching', () => {
    it('should handle file additions', async () => {
      await syncService.initialize(testConfig);
      const testFile = path.join('/test/dir', 'test.txt');
      
      // Simulate file creation
      await fs.writeFile(testFile, 'test content');
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Verify sync was triggered
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('should handle file modifications', async () => {
      await syncService.initialize(testConfig);
      const testFile = path.join('/test/dir', 'test.txt');
      
      // Simulate file modification
      await fs.writeFile(testFile, 'modified content');
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Verify sync was triggered
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('should handle file deletions', async () => {
      await syncService.initialize(testConfig);
      const testFile = path.join('/test/dir', 'test.txt');
      
      // Simulate file deletion
      await fs.unlink(testFile);
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Verify delete was triggered
      expect(storageService.deleteFile).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should retry failed uploads', async () => {
      await syncService.initialize(testConfig);
      const testFile = path.join('/test/dir', 'test.txt');
      
      // Mock upload to fail initially
      (storageService.uploadFile as jest.Mock)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce(undefined);
      
      // Simulate file creation
      await fs.writeFile(testFile, 'test content');
      
      // Wait for initial attempt and retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify retry was successful
      expect(storageService.uploadFile).toHaveBeenCalledTimes(2);
    });

    it('should log errors after max retries', async () => {
      await syncService.initialize(testConfig);
      const testFile = path.join('/test/dir', 'test.txt');
      
      // Mock upload to always fail
      (storageService.uploadFile as jest.Mock)
        .mockRejectedValue(new Error('Upload failed'));
      
      // Simulate file creation
      await fs.writeFile(testFile, 'test content');
      
      // Wait for all retries
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Verify error was logged
      expect(monitoringService.logStorageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SyncFailed',
        })
      );
    });
  });

  describe('Performance', () => {
    it('should handle concurrent operations', async () => {
      await syncService.initialize(testConfig);
      const files = Array.from({ length: 10 }, (_, i) => 
        path.join('/test/dir', `test${i}.txt`)
      );
      
      // Simulate multiple concurrent file creations
      await Promise.all(
        files.map(file => fs.writeFile(file, 'test content'))
      );
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify all files were processed
      expect(storageService.uploadFile).toHaveBeenCalledTimes(files.length);
    });

    it('should respect file size limits', async () => {
      await syncService.initialize(testConfig);
      const largeFile = path.join('/test/dir', 'large.txt');
      
      // Create file larger than maxFileSize
      const content = Buffer.alloc(testConfig.maxFileSize + 1);
      await fs.writeFile(largeFile, content);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Verify file was not uploaded
      expect(storageService.uploadFile).not.toHaveBeenCalled();
      expect(monitoringService.logStorageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Error',
          details: expect.objectContaining({
            message: expect.stringContaining('file size limit'),
          }),
        })
      );
    });
  });
});
