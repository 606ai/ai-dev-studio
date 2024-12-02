import { Dropbox } from 'dropbox';
import { CloudProvider, CloudProviderConfig } from '../../types/storage';
import { monitoringService } from '../monitoring';

export class DropboxProvider implements CloudProvider {
  name: string = 'dropbox';
  type: 'dropbox' = 'dropbox';
  isEnabled: boolean = false;
  isConnected: boolean = false;
  private client: Dropbox | null = null;
  config: CloudProviderConfig;

  constructor(config: CloudProviderConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      if (!this.config.credentials?.accessToken) {
        throw new Error('Dropbox credentials not configured');
      }

      this.client = new Dropbox({
        accessToken: this.config.credentials.accessToken,
      });

      // Verify connection
      await this.client.usersGetCurrentAccount();

      this.isEnabled = true;
      this.isConnected = true;

      await monitoringService.logStorageEvent({
        type: 'SyncStarted',
        details: {
          provider: this.name,
          message: 'Dropbox provider initialized',
        },
      });
    } catch (error) {
      this.isEnabled = false;
      this.isConnected = false;
      throw error;
    }
  }

  async uploadFile(path: string, content: Buffer): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Dropbox provider not initialized');
    }

    try {
      const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024; // 150MB

      if (content.length <= UPLOAD_FILE_SIZE_LIMIT) {
        // Simple upload for files <= 150MB
        await this.client.filesUpload({
          path: `/${path}`,
          contents: content,
          mode: { '.tag': 'overwrite' },
        });
      } else {
        // Start session for larger files
        const response = await this.client.filesUploadSessionStart({
          close: false,
          contents: content.slice(0, UPLOAD_FILE_SIZE_LIMIT),
        });

        let offset = UPLOAD_FILE_SIZE_LIMIT;
        const sessionId = response.result.session_id;

        while (offset < content.length) {
          const chunk = content.slice(
            offset,
            Math.min(offset + UPLOAD_FILE_SIZE_LIMIT, content.length)
          );

          if (offset + chunk.length === content.length) {
            // Last chunk
            await this.client.filesUploadSessionFinish({
              cursor: {
                session_id: sessionId,
                offset: offset,
              },
              commit: {
                path: `/${path}`,
                mode: { '.tag': 'overwrite' },
              },
              contents: chunk,
            });
          } else {
            // Intermediate chunks
            await this.client.filesUploadSessionAppendV2({
              cursor: {
                session_id: sessionId,
                offset: offset,
              },
              close: false,
              contents: chunk,
            });
          }

          offset += chunk.length;
        }
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
    if (!this.client || !this.isConnected) {
      throw new Error('Dropbox provider not initialized');
    }

    try {
      const response = await this.client.filesDownload({
        path: `/${path}`,
      });

      // @ts-ignore - Dropbox types are incorrect
      const buffer = Buffer.from(await response.result.fileBlob.arrayBuffer());
      return buffer;
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
    if (!this.client || !this.isConnected) {
      throw new Error('Dropbox provider not initialized');
    }

    try {
      await this.client.filesDeleteV2({
        path: `/${path}`,
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
    if (!this.client || !this.isConnected) {
      throw new Error('Dropbox provider not initialized');
    }

    try {
      const response = await this.client.filesListFolder({
        path: `/${prefix}`,
        recursive: true,
      });

      return response.result.entries
        .filter((entry) => entry['.tag'] === 'file')
        .map((entry) => entry.path_display!.substring(1)); // Remove leading slash
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
    if (!this.client || !this.isConnected) {
      throw new Error('Dropbox provider not initialized');
    }

    try {
      const response = await this.client.filesGetMetadata({
        path: `/${path}`,
      });

      if (response.result['.tag'] !== 'file') {
        throw new Error('Path is not a file');
      }

      const fileMetadata = response.result;
      return {
        size: fileMetadata.size,
        modified: new Date(fileMetadata.server_modified),
        hash: fileMetadata.content_hash,
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

  async disconnect(): Promise<void> {
    // Dropbox doesn't require explicit disconnection
    this.client = null;
    this.isConnected = false;
    this.isEnabled = false;

    await monitoringService.logStorageEvent({
      type: 'SyncCompleted',
      details: {
        provider: this.name,
        message: 'Dropbox provider disconnected',
      },
    });
  }
}
