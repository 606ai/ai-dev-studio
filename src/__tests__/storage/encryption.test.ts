import { EncryptionService } from '../../services/encryption';
import { jest } from '@jest/globals';

describe('Encryption Service', () => {
  let encryptionService: EncryptionService;
  const testPassword = 'test-password-123';
  const testData = Buffer.from('Hello, World!');

  beforeEach(() => {
    encryptionService = EncryptionService.getInstance();
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const encrypted = await encryptionService.encrypt(testData, testPassword);
      expect(encrypted.content).not.toEqual(testData);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();

      const decrypted = await encryptionService.decrypt(
        encrypted,
        testPassword
      );
      expect(decrypted).toEqual(testData);
    });

    it('should fail decryption with wrong password', async () => {
      const encrypted = await encryptionService.encrypt(
        testData,
        testPassword
      );
      await expect(
        encryptionService.decrypt(encrypted, 'wrong-password')
      ).rejects.toThrow();
    });

    it('should generate different IVs for same data', async () => {
      const encrypted1 = await encryptionService.encrypt(
        testData,
        testPassword
      );
      const encrypted2 = await encryptionService.encrypt(
        testData,
        testPassword
      );
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    });
  });

  describe('Key Management', () => {
    it('should cache and reuse keys', async () => {
      const keyId = encryptionService.generateKeyId();
      const encrypted1 = await encryptionService.encrypt(
        testData,
        testPassword,
        keyId
      );
      const encrypted2 = await encryptionService.encrypt(
        testData,
        testPassword,
        keyId
      );

      // Both should decrypt with same key
      const decrypted1 = await encryptionService.decrypt(
        encrypted1,
        testPassword,
        keyId
      );
      const decrypted2 = await encryptionService.decrypt(
        encrypted2,
        testPassword,
        keyId
      );

      expect(decrypted1).toEqual(testData);
      expect(decrypted2).toEqual(testData);
    });

    it('should rotate keys correctly', async () => {
      const keyId = encryptionService.generateKeyId();
      const newPassword = 'new-password-456';

      // Encrypt with old key
      const encrypted = await encryptionService.encrypt(
        testData,
        testPassword,
        keyId
      );

      // Rotate key
      await encryptionService.rotateKey(
        testPassword,
        newPassword,
        keyId
      );

      // Should decrypt with new password
      const decrypted = await encryptionService.decrypt(
        encrypted,
        newPassword,
        keyId
      );
      expect(decrypted).toEqual(testData);

      // Should fail with old password
      await expect(
        encryptionService.decrypt(encrypted, testPassword, keyId)
      ).rejects.toThrow();
    });

    it('should validate keys correctly', async () => {
      const keyId = encryptionService.generateKeyId();
      
      // Create key
      await encryptionService.encrypt(testData, testPassword, keyId);

      // Validate correct password
      const validResult = await encryptionService.validateKey(
        testPassword,
        keyId
      );
      expect(validResult).toBe(true);

      // Validate incorrect password
      const invalidResult = await encryptionService.validateKey(
        'wrong-password',
        keyId
      );
      expect(invalidResult).toBe(false);
    });
  });

  describe('File Encryption', () => {
    it('should encrypt and decrypt files', async () => {
      const fileContent = Buffer.from('This is a test file content');
      const encryptedFile = await encryptionService.encryptFile(
        fileContent,
        testPassword
      );

      expect(encryptedFile.length).toBeGreaterThan(fileContent.length);

      const decryptedFile = await encryptionService.decryptFile(
        encryptedFile,
        testPassword
      );
      expect(decryptedFile).toEqual(fileContent);
    });

    it('should handle empty files', async () => {
      const emptyContent = Buffer.from('');
      const encryptedFile = await encryptionService.encryptFile(
        emptyContent,
        testPassword
      );

      const decryptedFile = await encryptionService.decryptFile(
        encryptedFile,
        testPassword
      );
      expect(decryptedFile).toEqual(emptyContent);
    });

    it('should handle large files', async () => {
      const largeContent = Buffer.alloc(1024 * 1024); // 1MB
      largeContent.fill('X');

      const encryptedFile = await encryptionService.encryptFile(
        largeContent,
        testPassword
      );

      const decryptedFile = await encryptionService.decryptFile(
        encryptedFile,
        testPassword
      );
      expect(decryptedFile).toEqual(largeContent);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted encrypted data', async () => {
      const encrypted = await encryptionService.encrypt(
        testData,
        testPassword
      );

      // Corrupt the encrypted content
      encrypted.content[0] = encrypted.content[0] ^ 1;

      await expect(
        encryptionService.decrypt(encrypted, testPassword)
      ).rejects.toThrow();
    });

    it('should handle corrupted authentication tag', async () => {
      const encrypted = await encryptionService.encrypt(
        testData,
        testPassword
      );

      // Corrupt the auth tag
      encrypted.tag[0] = encrypted.tag[0] ^ 1;

      await expect(
        encryptionService.decrypt(encrypted, testPassword)
      ).rejects.toThrow();
    });

    it('should handle invalid IV length', async () => {
      const encrypted = await encryptionService.encrypt(
        testData,
        testPassword
      );

      // Corrupt the IV
      encrypted.iv = Buffer.alloc(8); // Wrong length

      await expect(
        encryptionService.decrypt(encrypted, testPassword)
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle concurrent operations', async () => {
      const operations = Array(10).fill(null).map(() =>
        encryptionService.encrypt(testData, testPassword)
      );

      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);

      const decryptions = results.map(encrypted =>
        encryptionService.decrypt(encrypted, testPassword)
      );

      const decrypted = await Promise.all(decryptions);
      decrypted.forEach(result =>
        expect(result).toEqual(testData)
      );
    });

    it('should maintain performance with key cache', async () => {
      const keyId = encryptionService.generateKeyId();
      const iterations = 100;

      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        await encryptionService.encrypt(testData, testPassword, keyId);
      }
      const duration = Date.now() - start;

      // Average time per operation should be reasonable
      expect(duration / iterations).toBeLessThan(10); // Less than 10ms per op
    });
  });
});
