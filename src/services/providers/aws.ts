import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { CloudProvider, CloudProviderConfig } from '../../types/storage';
import { monitoringService } from '../monitoring';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

export class AWSProvider implements CloudProvider {
  name: string = 'aws';
  type: 'aws' = 'aws';
  isEnabled: boolean = false;
  isConnected: boolean = false;
  private client: S3Client | null = null;
  config: CloudProviderConfig;

  constructor(config: CloudProviderConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      if (
        !this.config.credentials?.accessKeyId ||
        !this.config.credentials?.secretAccessKey ||
        !this.config.bucket
      ) {
        throw new Error('AWS credentials or bucket not configured');
      }

      this.client = new S3Client({
        region: this.config.region || 'us-east-1',
        credentials: {
          accessKeyId: this.config.credentials.accessKeyId,
          secretAccessKey: this.config.credentials.secretAccessKey,
        },
      });

      // Verify connection by listing objects
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
          MaxKeys: 1,
        })
      );

      this.isEnabled = true;
      this.isConnected = true;

      await monitoringService.logStorageEvent({
        type: 'SyncStarted',
        details: {
          provider: this.name,
          message: 'AWS S3 provider initialized',
        },
      });
    } catch (error) {
      this.isEnabled = false;
      this.isConnected = false;
      throw error;
    }
  }

  async uploadFile(path: string, content: Buffer): Promise<void> {
    if (!this.client || !this.isConnected || !this.config.bucket) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const key = this.normalizePath(path);
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: content,
        ContentType: 'application/octet-stream',
      });

      await this.client.send(command);

      await monitoringService.logStorageEvent({
        type: 'FileUpload',
        details: {
          provider: this.name,
          path: key,
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
    if (!this.client || !this.isConnected || !this.config.bucket) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const key = this.normalizePath(path);
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      const stream = response.Body as Readable;
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
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
    if (!this.client || !this.isConnected || !this.config.bucket) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const key = this.normalizePath(path);
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.client.send(command);

      await monitoringService.logStorageEvent({
        type: 'FileDelete',
        details: {
          provider: this.name,
          path: key,
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
    if (!this.client || !this.isConnected || !this.config.bucket) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const normalizedPrefix = this.normalizePath(prefix);
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: normalizedPrefix,
      });

      const files: string[] = [];
      let continuationToken: string | undefined;

      do {
        const response = await this.client.send(command);
        response.Contents?.forEach((item) => {
          if (item.Key) {
            files.push(item.Key);
          }
        });
        continuationToken = response.NextContinuationToken;
        command.input.ContinuationToken = continuationToken;
      } while (continuationToken);

      return files;
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
    if (!this.client || !this.isConnected || !this.config.bucket) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const key = this.normalizePath(path);
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        size: response.ContentLength || 0,
        modified: response.LastModified || new Date(),
        hash: response.ETag?.replace(/"/g, '') || '',
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

  async generatePresignedUrl(
    path: string,
    operation: 'upload' | 'download',
    expiresIn: number = 3600
  ): Promise<string> {
    if (!this.client || !this.isConnected || !this.config.bucket) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const key = this.normalizePath(path);
      const command = operation === 'upload'
        ? new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
          })
        : new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
          });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          provider: this.name,
          operation: 'presignedUrl',
          path,
          error,
        },
      });
      throw error;
    }
  }

  private normalizePath(path: string): string {
    // Remove leading slash and normalize path separators
    return path.replace(/^\/+/, '').replace(/\\/g, '/');
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = false;

    await monitoringService.logStorageEvent({
      type: 'SyncCompleted',
      details: {
        provider: this.name,
        message: 'AWS S3 provider disconnected',
      },
    });
  }
}
