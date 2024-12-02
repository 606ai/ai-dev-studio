import { google } from 'googleapis';
import { CloudProvider, CloudProviderConfig } from '../../types/storage';
import { monitoringService } from '../monitoring';
import stream from 'stream';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);

export class GoogleDriveProvider implements CloudProvider {
  name: string = 'gdrive';
  type: 'gdrive' = 'gdrive';
  isEnabled: boolean = false;
  isConnected: boolean = false;
  private drive: any = null;
  config: CloudProviderConfig;

  constructor(config: CloudProviderConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      if (
        !this.config.credentials?.clientId ||
        !this.config.credentials?.clientSecret ||
        !this.config.credentials?.refreshToken
      ) {
        throw new Error('Google Drive credentials not configured');
      }

      const auth = new google.auth.OAuth2(
        this.config.credentials.clientId,
        this.config.credentials.clientSecret,
        this.config.credentials.redirectUri
      );

      auth.setCredentials({
        refresh_token: this.config.credentials.refreshToken,
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.isEnabled = true;
      this.isConnected = true;

      await monitoringService.logStorageEvent({
        type: 'SyncStarted',
        details: {
          provider: this.name,
          message: 'Google Drive provider initialized',
        },
      });
    } catch (error) {
      this.isEnabled = false;
      this.isConnected = false;
      throw error;
    }
  }

  async uploadFile(path: string, content: Buffer): Promise<void> {
    if (!this.drive || !this.isConnected) {
      throw new Error('Google Drive provider not initialized');
    }

    try {
      // Check if file exists
      const existingFile = await this.findFile(path);
      const fileMetadata = {
        name: path.split('/').pop(),
        parents: [this.config.options?.folderId || 'root'],
      };

      const media = {
        mimeType: 'application/octet-stream',
        body: stream.Readable.from(content),
      };

      if (existingFile) {
        // Update existing file
        await this.drive.files.update({
          fileId: existingFile.id,
          media: media,
          fields: 'id, name, size, modifiedTime',
        });
      } else {
        // Create new file
        await this.drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, name, size, modifiedTime',
        });
      }

      await monitoringService.logStorageEvent({
        type: 'FileUpload',
        details: {
          provider: this.name,
          path,
          size: content.length,
        },
      });
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          provider: this.name,
          operation: 'upload',
          path,
          error,
        },
      });
      throw error;
    }
  }

  async downloadFile(path: string): Promise<Buffer> {
    if (!this.drive || !this.isConnected) {
      throw new Error('Google Drive provider not initialized');
    }

    try {
      const file = await this.findFile(path);
      if (!file) {
        throw new Error('File not found');
      }

      const response = await this.drive.files.get(
        {
          fileId: file.id,
          alt: 'media',
        },
        { responseType: 'stream' }
      );

      const chunks: Buffer[] = [];
      await pipeline(
        response.data,
        new stream.Writable({
          write(chunk, encoding, callback) {
            chunks.push(Buffer.from(chunk));
            callback();
          },
        })
      );

      return Buffer.concat(chunks);
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          provider: this.name,
          operation: 'download',
          path,
          error,
        },
      });
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.drive || !this.isConnected) {
      throw new Error('Google Drive provider not initialized');
    }

    try {
      const file = await this.findFile(path);
      if (!file) {
        throw new Error('File not found');
      }

      await this.drive.files.delete({
        fileId: file.id,
      });

      await monitoringService.logStorageEvent({
        type: 'FileDelete',
        details: {
          provider: this.name,
          path,
        },
      });
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          provider: this.name,
          operation: 'delete',
          path,
          error,
        },
      });
      throw error;
    }
  }

  async listFiles(prefix: string = ''): Promise<string[]> {
    if (!this.drive || !this.isConnected) {
      throw new Error('Google Drive provider not initialized');
    }

    try {
      const query = prefix
        ? `name contains '${prefix}' and trashed = false`
        : 'trashed = false';

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, parents)',
        spaces: 'drive',
      });

      return response.data.files.map((file: any) => file.name);
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          provider: this.name,
          operation: 'list',
          prefix,
          error,
        },
      });
      throw error;
    }
  }

  async getFileMetadata(path: string): Promise<{
    size: number;
    modified: Date;
    hash: string;
  }> {
    if (!this.drive || !this.isConnected) {
      throw new Error('Google Drive provider not initialized');
    }

    try {
      const file = await this.findFile(path);
      if (!file) {
        throw new Error('File not found');
      }

      const metadata = await this.drive.files.get({
        fileId: file.id,
        fields: 'size, modifiedTime, md5Checksum',
      });

      return {
        size: parseInt(metadata.data.size),
        modified: new Date(metadata.data.modifiedTime),
        hash: metadata.data.md5Checksum,
      };
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          provider: this.name,
          operation: 'metadata',
          path,
          error,
        },
      });
      throw error;
    }
  }

  private async findFile(path: string): Promise<{ id: string } | null> {
    const fileName = path.split('/').pop();
    const response = await this.drive.files.list({
      q: `name = '${fileName}' and trashed = false`,
      fields: 'files(id, name, parents)',
      spaces: 'drive',
    });

    return response.data.files[0] || null;
  }

  async disconnect(): Promise<void> {
    this.drive = null;
    this.isConnected = false;
    this.isEnabled = false;

    await monitoringService.logStorageEvent({
      type: 'SyncCompleted',
      details: {
        provider: this.name,
        message: 'Google Drive provider disconnected',
      },
    });
  }
}
