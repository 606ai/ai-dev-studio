import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const BACKUP_DIR = path.join(__dirname, '../backups');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-dev-studio';

// Function to list available backups
function listBackups() {
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-'))
    .map(file => {
      const backupPath = path.join(BACKUP_DIR, file);
      const metadata = JSON.parse(
        fs.readFileSync(
          path.join(backupPath, 'metadata.json'),
          'utf-8'
        )
      );
      return {
        name: file,
        path: backupPath,
        timestamp: metadata.timestamp,
        collections: metadata.collections,
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log('\nAvailable backups:');
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   Created: ${backup.timestamp}`);
    console.log(`   Collections: ${backup.collections.join(', ')}\n`);
  });

  return backups;
}

// Function to restore backup
function restoreBackup(backupPath: string) {
  const cmd = `mongorestore --uri="${MONGODB_URI}" --drop "${backupPath}"`;

  console.log('Starting database restore...');
  console.log('Warning: This will override existing data!');

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Error during restore:', error);
      process.exit(1);
    }

    console.log('Restore completed successfully!');
  });
}

// Interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Database Restore Utility');
const backups = listBackups();

if (backups.length === 0) {
  console.log('No backups found.');
  process.exit(0);
}

rl.question('\nEnter the number of the backup to restore (or 0 to exit): ', (answer) => {
  const selection = parseInt(answer);

  if (selection === 0) {
    console.log('Exiting...');
    process.exit(0);
  }

  if (selection < 1 || selection > backups.length) {
    console.log('Invalid selection.');
    process.exit(1);
  }

  const selectedBackup = backups[selection - 1];

  rl.question(`Are you sure you want to restore ${selectedBackup.name}? (yes/no): `, (confirm) => {
    if (confirm.toLowerCase() === 'yes') {
      restoreBackup(selectedBackup.path);
    } else {
      console.log('Restore cancelled.');
    }
    rl.close();
  });
});
