import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const BACKUP_DIR = path.join(__dirname, '../backups');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-dev-studio';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create timestamp for backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

// Extract database name from URI
const dbName = MONGODB_URI.split('/').pop();

// Create backup command
const cmd = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;

console.log('Starting database backup...');

exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error('Error during backup:', error);
    process.exit(1);
  }

  console.log('Backup completed successfully!');
  console.log(`Backup location: ${backupPath}`);

  // Clean up old backups (keep last 5)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-'))
    .map(file => path.join(BACKUP_DIR, file))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());

  if (backups.length > 5) {
    backups.slice(5).forEach(backup => {
      fs.rmSync(backup, { recursive: true, force: true });
      console.log(`Removed old backup: ${backup}`);
    });
  }

  // Create backup metadata
  const metadataPath = path.join(backupPath, 'metadata.json');
  const metadata = {
    timestamp: new Date().toISOString(),
    dbName,
    collections: fs.readdirSync(path.join(backupPath, dbName)),
  };

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
});
