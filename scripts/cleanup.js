const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class StorageCleanup {
  constructor(config = {}) {
    this.config = {
      // Files not accessed in X days are considered stale
      staleThresholdDays: 90,
      // Minimum file size to consider for cleanup (1MB)
      minSizeBytes: 1024 * 1024,
      // File patterns to ignore
      ignorePatterns: [
        'node_modules',
        '.git',
        'package-lock.json',
        'yarn.lock',
        '.env',
      ],
      // Directories to archive
      archiveDirectories: ['logs', 'temp', 'downloads'],
      // Archive location
      archivePath: './archives',
      ...config
    };
  }

  async initialize() {
    // Create archive directory if it doesn't exist
    try {
      await fs.mkdir(this.config.archivePath, { recursive: true });
      console.log(`Archive directory created at ${this.config.archivePath}`);
    } catch (error) {
      console.error('Error creating archive directory:', error);
    }
  }

  shouldIgnore(filePath) {
    return this.config.ignorePatterns.some(pattern => 
      filePath.includes(pattern)
    );
  }

  async isStale(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const lastAccessed = stats.atime;
      const daysSinceAccess = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAccess > this.config.staleThresholdDays;
    } catch (error) {
      console.error(`Error checking if file is stale: ${filePath}`, error);
      return false;
    }
  }

  async cleanupStaleFiles(directory) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (this.shouldIgnore(fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.cleanupStaleFiles(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          if (stats.size >= this.config.minSizeBytes && await this.isStale(fullPath)) {
            console.log(`Removing stale file: ${fullPath}`);
            await fs.unlink(fullPath);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up stale files:', error);
    }
  }

  async archiveDirectory(directory) {
    const archiveName = `${path.basename(directory)}_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const archivePath = path.join(this.config.archivePath, archiveName);

    try {
      // Create zip archive using PowerShell
      await execAsync(
        `powershell Compress-Archive -Path "${directory}/*" -DestinationPath "${archivePath}" -Force`
      );
      
      // Remove original directory contents after successful archive
      const entries = await fs.readdir(directory);
      for (const entry of entries) {
        const fullPath = path.join(directory, entry);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await fs.rm(fullPath, { recursive: true });
        } else {
          await fs.unlink(fullPath);
        }
      }

      console.log(`Successfully archived ${directory} to ${archivePath}`);
    } catch (error) {
      console.error(`Error archiving directory ${directory}:`, error);
    }
  }

  async cleanupNodeModules() {
    try {
      // Remove node_modules
      await execAsync('npm cache clean --force');
      console.log('npm cache cleaned');

      // Optional: Remove and reinstall node_modules
      const shouldReinstall = process.env.REINSTALL_MODULES === 'true';
      if (shouldReinstall) {
        await execAsync('npm ci');
        console.log('node_modules reinstalled');
      }
    } catch (error) {
      console.error('Error cleaning npm cache:', error);
    }
  }

  async run() {
    console.log('Starting cleanup process...');
    
    await this.initialize();

    // Clean stale files
    console.log('Cleaning up stale files...');
    await this.cleanupStaleFiles(process.cwd());

    // Archive specified directories
    console.log('Archiving directories...');
    for (const dir of this.config.archiveDirectories) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        const exists = await fs.access(dirPath).then(() => true).catch(() => false);
        if (exists) {
          await this.archiveDirectory(dirPath);
        }
      } catch (error) {
        console.error(`Error processing directory ${dir}:`, error);
      }
    }

    // Cleanup node_modules if specified
    if (process.env.CLEANUP_MODULES === 'true') {
      console.log('Cleaning up node_modules...');
      await this.cleanupNodeModules();
    }

    console.log('Cleanup process completed!');
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleanup = new StorageCleanup();
  cleanup.run().catch(console.error);
}

module.exports = StorageCleanup;
