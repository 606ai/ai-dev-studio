import { Client } from '@microsoft/microsoft-graph-client';
import { AuthProvider } from '@microsoft/microsoft-graph-client/authProvider';
import { formatBytes, formatDate } from '../src/utils/format';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface FileInfo {
  id: string;
  name: string;
  size: number;
  lastModified: Date;
  path: string;
}

class OneDriveCleanup {
  private client: Client;
  private totalSize: number = 0;
  private files: FileInfo[] = [];
  private largeFiles: FileInfo[] = [];
  private duplicateFiles: Map<string, FileInfo[]> = new Map();
  private oldFiles: FileInfo[] = [];

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  async analyze(): Promise<void> {
    console.log('Analyzing OneDrive contents...');
    await this.scanFiles('/drive/root/children');
    this.categorizeFiles();
    this.printAnalysis();
  }

  private async scanFiles(path: string): Promise<void> {
    try {
      const response = await this.client.api(path).get();
      
      for (const item of response.value) {
        if (item.folder) {
          // Recursively scan folders
          await this.scanFiles(`/drive/items/${item.id}/children`);
        } else if (item.file) {
          this.totalSize += item.size;
          this.files.push({
            id: item.id,
            name: item.name,
            size: item.size,
            lastModified: new Date(item.lastModifiedDateTime),
            path: item.parentReference.path,
          });
        }
      }
    } catch (error) {
      console.error('Error scanning files:', error);
    }
  }

  private categorizeFiles(): void {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Find large files (>100MB)
    this.largeFiles = this.files.filter(file => file.size > 100 * 1024 * 1024);

    // Find potential duplicates (same name and size)
    const fileMap = new Map<string, FileInfo[]>();
    this.files.forEach(file => {
      const key = `${file.name}_${file.size}`;
      if (!fileMap.has(key)) {
        fileMap.set(key, []);
      }
      fileMap.get(key)!.push(file);
    });
    
    fileMap.forEach((files, key) => {
      if (files.length > 1) {
        this.duplicateFiles.set(key, files);
      }
    });

    // Find old files
    this.oldFiles = this.files.filter(file => file.lastModified < sixMonthsAgo);
  }

  private printAnalysis(): void {
    console.log('\n=== OneDrive Analysis ===');
    console.log(`Total Storage Used: ${formatBytes(this.totalSize)}`);
    console.log(`Total Files: ${this.files.length}`);
    
    console.log('\n=== Large Files (>100MB) ===');
    this.largeFiles.forEach(file => {
      console.log(`${file.path}/${file.name} (${formatBytes(file.size)})`);
    });

    console.log('\n=== Potential Duplicates ===');
    this.duplicateFiles.forEach((files, key) => {
      console.log(`\nDuplicate set (${formatBytes(files[0].size)}):`);
      files.forEach(file => {
        console.log(`- ${file.path}/${file.name}`);
      });
    });

    console.log('\n=== Old Files (>6 months) ===');
    this.oldFiles.forEach(file => {
      console.log(`${file.path}/${file.name} (Last modified: ${formatDate(file.lastModified)})`);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.client.api(`/drive/items/${fileId}`).delete();
      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async moveToArchive(fileId: string, archiveFolderId: string): Promise<void> {
    try {
      await this.client.api(`/drive/items/${fileId}`).patch({
        parentReference: {
          id: archiveFolderId
        }
      });
      console.log('File moved to archive successfully');
    } catch (error) {
      console.error('Error moving file to archive:', error);
    }
  }

  getLargeFiles(): FileInfo[] {
    return this.largeFiles;
  }

  getDuplicateFiles(): Map<string, FileInfo[]> {
    return this.duplicateFiles;
  }

  getOldFiles(): FileInfo[] {
    return this.oldFiles;
  }
}

async function main() {
  const accessToken = process.env.ONEDRIVE_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('Please set ONEDRIVE_ACCESS_TOKEN in your .env file');
    process.exit(1);
  }

  const cleanup = new OneDriveCleanup(accessToken);
  await cleanup.analyze();

  // Example of how to use the results
  const largeFiles = cleanup.getLargeFiles();
  const duplicateFiles = cleanup.getDuplicateFiles();
  const oldFiles = cleanup.getOldFiles();

  // Create a report
  const report = {
    timestamp: new Date().toISOString(),
    largeFiles: largeFiles.map(f => ({
      path: `${f.path}/${f.name}`,
      size: formatBytes(f.size)
    })),
    duplicateFiles: Array.from(duplicateFiles.entries()).map(([key, files]) => ({
      size: formatBytes(files[0].size),
      files: files.map(f => `${f.path}/${f.name}`)
    })),
    oldFiles: oldFiles.map(f => ({
      path: `${f.path}/${f.name}`,
      lastModified: formatDate(f.lastModified)
    }))
  };

  // Save report
  fs.writeFileSync(
    path.join(__dirname, 'onedrive-cleanup-report.json'),
    JSON.stringify(report, null, 2)
  );
}

main().catch(console.error);
