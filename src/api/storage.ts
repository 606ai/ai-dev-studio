import express from 'express';
import { SpaceAnalyzer } from '../../scripts/space-analyzer';
import { StorageCleanup } from '../../scripts/cleanup';
import { SyncManager } from '../../scripts/sync-manager';
import { storage } from '../config/firebase';
import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';
import { scheduleJob } from 'node-schedule';

const router = express.Router();

// Initialize managers
const analyzer = new SpaceAnalyzer();
const cleanup = new StorageCleanup();
const syncManager = new SyncManager();

// Schedule automated tasks
scheduleJob('0 0 * * *', async () => { // Run daily at midnight
  try {
    await analyzer.analyzeDirectory();
    // Only cleanup if space usage is above 80%
    if (analyzer.results.totalSize > process.env.STORAGE_THRESHOLD) {
      await cleanup.run();
    }
  } catch (error) {
    console.error('Scheduled task failed:', error);
  }
});

// Analyze storage
router.get('/analyze', async (req, res) => {
  try {
    await analyzer.analyzeDirectory();
    res.json(analyzer.results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze storage' });
  }
});

// Backup to cloud
router.post('/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const backupRef = ref(storage, `backups/${timestamp}`);
    
    // Get list of files to backup
    const filesToBackup = analyzer.results.largeFiles
      .concat(analyzer.results.unusedFiles)
      .map(file => file.path);

    // Upload each file
    for (const file of filesToBackup) {
      const fileRef = ref(backupRef, file);
      const response = await fetch(file);
      const blob = await response.blob();
      await uploadBytes(fileRef, blob);
    }

    res.json({ message: 'Backup completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Clean up storage
router.post('/cleanup', async (req, res) => {
  try {
    await cleanup.run();
    res.json({ message: 'Cleanup completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Start/stop sync
router.post('/sync', async (req, res) => {
  try {
    const { action } = req.body;
    if (action === 'start') {
      await syncManager.initialize();
      await syncManager.setupWatchers();
      res.json({ message: 'Sync started successfully' });
    } else if (action === 'stop') {
      await syncManager.stop();
      res.json({ message: 'Sync stopped successfully' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Sync operation failed' });
  }
});

// Get sync status
router.get('/sync/status', (req, res) => {
  try {
    const status = syncManager.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Get backup history
router.get('/backup/history', async (req, res) => {
  try {
    const backupsRef = ref(storage, 'backups');
    const backups = await listAll(backupsRef);
    
    const backupHistory = await Promise.all(
      backups.prefixes.map(async (backupRef) => {
        const files = await listAll(backupRef);
        const urls = await Promise.all(
          files.items.map(file => getDownloadURL(file))
        );
        
        return {
          timestamp: backupRef.name,
          files: urls
        };
      })
    );

    res.json(backupHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get backup history' });
  }
});

export default router;
