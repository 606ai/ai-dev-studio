const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class SpaceAnalyzer {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.results = {
      totalSize: 0,
      largestFiles: [],
      unusedFiles: [],
      duplicates: new Map(),
      fileTypes: new Map()
    };
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  async getLastAccessTime(filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.atime;
    } catch (error) {
      console.error(`Error getting access time for ${filePath}:`, error);
      return new Date(0);
    }
  }

  async analyzeDirectory(dirPath = this.rootPath) {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and other specified directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await this.analyzeDirectory(fullPath);
          }
        } else {
          const stats = await fs.promises.stat(fullPath);
          const fileSize = stats.size;
          const fileType = path.extname(entry.name).toLowerCase();
          const lastAccessed = await this.getLastAccessTime(fullPath);
          
          // Update total size
          this.results.totalSize += fileSize;

          // Track file types
          this.results.fileTypes.set(
            fileType,
            (this.results.fileTypes.get(fileType) || 0) + fileSize
          );

          // Track large files
          if (fileSize > 1024 * 1024) { // Files larger than 1MB
            this.results.largestFiles.push({
              path: fullPath,
              size: fileSize,
              type: fileType
            });
          }

          // Track potentially unused files (not accessed in last 3 months)
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          if (lastAccessed < threeMonthsAgo) {
            this.results.unusedFiles.push({
              path: fullPath,
              size: fileSize,
              lastAccessed
            });
          }

          // Track potential duplicates by size
          const sizeKey = `${fileSize}-${fileType}`;
          if (!this.results.duplicates.has(sizeKey)) {
            this.results.duplicates.set(sizeKey, []);
          }
          this.results.duplicates.get(sizeKey).push(fullPath);
        }
      }
    } catch (error) {
      console.error('Error analyzing directory:', error);
    }
  }

  async generateReport() {
    console.log('\n=== Space Usage Analysis Report ===\n');
    
    // Total size
    console.log(`Total Size: ${this.formatSize(this.results.totalSize)}\n`);

    // File types breakdown
    console.log('File Types Breakdown:');
    const sortedTypes = [...this.results.fileTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [type, size] of sortedTypes) {
      console.log(`${type || 'no extension'}: ${this.formatSize(size)}`);
    }

    // Largest files
    console.log('\nLargest Files:');
    this.results.largestFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach(file => {
        console.log(`${file.path} (${this.formatSize(file.size)})`);
      });

    // Unused files
    console.log('\nPotentially Unused Files:');
    this.results.unusedFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach(file => {
        console.log(
          `${file.path} (${this.formatSize(file.size)}) - Last accessed: ${file.lastAccessed.toLocaleDateString()}`
        );
      });

    // Potential duplicates
    console.log('\nPotential Duplicates:');
    for (const [sizeKey, files] of this.results.duplicates) {
      if (files.length > 1) {
        console.log(`\nSize: ${sizeKey.split('-')[0]} bytes, Type: ${sizeKey.split('-')[1]}`);
        files.forEach(file => console.log(`  ${file}`));
      }
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new SpaceAnalyzer(process.cwd());
  analyzer.analyzeDirectory()
    .then(() => analyzer.generateReport())
    .catch(console.error);
}

module.exports = SpaceAnalyzer;
