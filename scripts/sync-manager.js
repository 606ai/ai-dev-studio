const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class SyncManager {
  constructor(config = {}) {
    this.config = {
      // Directories to sync
      syncDirs: ['src', 'public', 'scripts'],
      // Files to always sync
      criticalFiles: [
        'package.json',
        'tsconfig.json',
        'README.md',
        '.env.example'
      ],
      // Patterns to ignore
      ignorePatterns: [
        '**/node_modules/**',
        '**/build/**',
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**',
        '*.log'
      ],
      // Cloud providers configuration
      providers: {
        onedrive: {
          enabled: true,
          path: process.env.ONEDRIVE_PATH || '',
        },
        dropbox: {
          enabled: false,
          path: process.env.DROPBOX_PATH || '',
        },
        gdrive: {
          enabled: false,
          path: process.env.GDRIVE_PATH || '',
        }
      },
      ...config
    };

    this.watchers = new Map();
  }

  async initialize() {
    console.log('Initializing sync manager...');
    
    // Validate provider paths
    for (const [provider, config] of Object.entries(this.config.providers)) {
      if (config.enabled) {
        try {
          await fs.access(config.path);
          console.log(`${provider} path verified: ${config.path}`);
        } catch (error) {
          console.error(`Invalid path for ${provider}: ${config.path}`);
          config.enabled = false;
        }
      }
    }

    // Create .syncconfig file
    const syncConfig = {
      lastSync: new Date().toISOString(),
      syncDirs: this.config.syncDirs,
      criticalFiles: this.config.criticalFiles,
      ignorePatterns: this.config.ignorePatterns
    };

    await fs.writeFile(
      '.syncconfig',
      JSON.stringify(syncConfig, null, 2)
    );
  }

  async setupWatchers() {
    // Watch directories
    for (const dir of this.config.syncDirs) {
      const watcher = chokidar.watch(dir, {
        ignored: this.config.ignorePatterns,
        persistent: true
      });

      watcher
        .on('add', path => this.syncFile(path))
        .on('change', path => this.syncFile(path))
        .on('unlink', path => this.removeFile(path));

      this.watchers.set(dir, watcher);
    }

    // Watch critical files
    const criticalWatcher = chokidar.watch(this.config.criticalFiles, {
      persistent: true
    });

    criticalWatcher
      .on('add', path => this.syncFile(path, true))
      .on('change', path => this.syncFile(path, true));

    this.watchers.set('critical', criticalWatcher);
  }

  async syncFile(filePath, isCritical = false) {
    console.log(`Syncing ${isCritical ? 'critical ' : ''}file: ${filePath}`);

    for (const [provider, config] of Object.entries(this.config.providers)) {
      if (config.enabled) {
        const targetPath = path.join(config.path, filePath);
        
        try {
          // Create directory structure if needed
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          
          // Copy file
          await fs.copyFile(filePath, targetPath);
          console.log(`Synced to ${provider}: ${targetPath}`);
        } catch (error) {
          console.error(`Error syncing to ${provider}:`, error);
        }
      }
    }
  }

  async removeFile(filePath) {
    console.log(`Removing file from sync: ${filePath}`);

    for (const [provider, config] of Object.entries(this.config.providers)) {
      if (config.enabled) {
        const targetPath = path.join(config.path, filePath);
        
        try {
          await fs.unlink(targetPath);
          console.log(`Removed from ${provider}: ${targetPath}`);
        } catch (error) {
          // Ignore if file doesn't exist
          if (error.code !== 'ENOENT') {
            console.error(`Error removing from ${provider}:`, error);
          }
        }
      }
    }
  }

  async stop() {
    console.log('Stopping sync manager...');
    
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    
    this.watchers.clear();
  }
}

// Run sync manager if called directly
if (require.main === module) {
  const manager = new SyncManager();
  
  process.on('SIGINT', async () => {
    console.log('Shutting down sync manager...');
    await manager.stop();
    process.exit(0);
  });

  manager.initialize()
    .then(() => manager.setupWatchers())
    .catch(console.error);
}

module.exports = SyncManager;
