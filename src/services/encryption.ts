import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { monitoringService } from './monitoring';

const scryptAsync = promisify(scrypt);

interface EncryptionKey {
  key: Buffer;
  salt: Buffer;
}

interface EncryptedData {
  iv: Buffer;
  content: Buffer;
  tag: Buffer;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private keyCache: Map<string, EncryptionKey>;
  private algorithm: string;
  private keyLength: number;

  private constructor() {
    this.keyCache = new Map();
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async encrypt(
    data: Buffer,
    password: string,
    keyId?: string
  ): Promise<EncryptedData> {
    try {
      const { key, salt } = await this.getKey(password, keyId);
      const iv = randomBytes(16);

      const cipher = createCipheriv(this.algorithm, key, iv, {
        authTagLength: 16,
      });

      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();

      await monitoringService.logStorageEvent({
        type: 'FileUpload',
        details: {
          message: 'Data encrypted',
          size: data.length,
          keyId,
        },
      });

      return {
        iv,
        content: encrypted,
        tag,
      };
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Encryption failed',
          error,
        },
      });
      throw error;
    }
  }

  async decrypt(
    encryptedData: EncryptedData,
    password: string,
    keyId?: string
  ): Promise<Buffer> {
    try {
      const { key } = await this.getKey(password, keyId);

      const decipher = createDecipheriv(
        this.algorithm,
        key,
        encryptedData.iv,
        {
          authTagLength: 16,
        }
      );

      decipher.setAuthTag(encryptedData.tag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedData.content),
        decipher.final(),
      ]);

      await monitoringService.logStorageEvent({
        type: 'FileUpload',
        details: {
          message: 'Data decrypted',
          size: decrypted.length,
          keyId,
        },
      });

      return decrypted;
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Decryption failed',
          error,
        },
      });
      throw error;
    }
  }

  async rotateKey(
    oldPassword: string,
    newPassword: string,
    keyId: string
  ): Promise<void> {
    try {
      const oldKey = await this.getKey(oldPassword, keyId);
      const newKey = await this.generateKey(newPassword);

      // Store new key
      this.keyCache.set(keyId, newKey);

      await monitoringService.logStorageEvent({
        type: 'FileUpload',
        details: {
          message: 'Key rotated',
          keyId,
        },
      });
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Key rotation failed',
          keyId,
          error,
        },
      });
      throw error;
    }
  }

  async validateKey(
    password: string,
    keyId: string
  ): Promise<boolean> {
    try {
      const storedKey = this.keyCache.get(keyId);
      if (!storedKey) {
        return false;
      }

      const testKey = await this.deriveKey(password, storedKey.salt);
      return testKey.equals(storedKey.key);
    } catch (error) {
      await monitoringService.logStorageEvent({
        type: 'Error',
        details: {
          message: 'Key validation failed',
          keyId,
          error,
        },
      });
      return false;
    }
  }

  private async getKey(
    password: string,
    keyId?: string
  ): Promise<EncryptionKey> {
    if (keyId && this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    const key = await this.generateKey(password);
    if (keyId) {
      this.keyCache.set(keyId, key);
    }

    return key;
  }

  private async generateKey(password: string): Promise<EncryptionKey> {
    const salt = randomBytes(32);
    const key = await this.deriveKey(password, salt);
    return { key, salt };
  }

  private async deriveKey(
    password: string,
    salt: Buffer
  ): Promise<Buffer> {
    return await scryptAsync(
      password,
      salt,
      this.keyLength
    ) as Buffer;
  }

  async encryptFile(
    content: Buffer,
    password: string,
    keyId?: string
  ): Promise<Buffer> {
    const encrypted = await this.encrypt(content, password, keyId);
    
    // Format: IV (16 bytes) + Tag (16 bytes) + Encrypted Content
    return Buffer.concat([
      encrypted.iv,
      encrypted.tag,
      encrypted.content,
    ]);
  }

  async decryptFile(
    encryptedContent: Buffer,
    password: string,
    keyId?: string
  ): Promise<Buffer> {
    // Extract components
    const iv = encryptedContent.slice(0, 16);
    const tag = encryptedContent.slice(16, 32);
    const content = encryptedContent.slice(32);

    return await this.decrypt(
      { iv, tag, content },
      password,
      keyId
    );
  }

  generateKeyId(): string {
    return randomBytes(16).toString('hex');
  }
}

export const encryptionService = EncryptionService.getInstance();
