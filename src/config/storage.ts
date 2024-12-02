export interface StorageConfig {
  threshold: number;
  backupRetentionDays: number;
  backupSchedule: string;
  syncEnabled: boolean;
  syncInterval: number;
  providers: {
    firebase: boolean;
    onedrive: boolean;
    dropbox: boolean;
    gdrive: boolean;
  };
  paths: {
    onedrive?: string;
    dropbox?: string;
    gdrive?: string;
  };
}

const config: StorageConfig = {
  threshold: Number(process.env.STORAGE_THRESHOLD) || 85,
  backupRetentionDays: Number(process.env.BACKUP_RETENTION_DAYS) || 30,
  backupSchedule: process.env.BACKUP_SCHEDULE || '0 0 * * *',
  syncEnabled: process.env.SYNC_ENABLED === 'true',
  syncInterval: Number(process.env.SYNC_INTERVAL) || 300,
  providers: {
    firebase: true, // Firebase is our primary storage
    onedrive: process.env.ONEDRIVE_PATH ? true : false,
    dropbox: process.env.DROPBOX_PATH ? true : false,
    gdrive: process.env.GDRIVE_PATH ? true : false,
  },
  paths: {
    onedrive: process.env.ONEDRIVE_PATH,
    dropbox: process.env.DROPBOX_PATH,
    gdrive: process.env.GDRIVE_PATH,
  },
};

export default config;
