import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storageService, StorageItem } from '../../services/storage';

interface StorageState {
  files: StorageItem[];
  backups: Array<{ timestamp: string; files: StorageItem[] }>;
  stats: {
    totalSize: number;
    usedSize: number;
    fileCount: number;
    backupCount: number;
  } | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: StorageState = {
  files: [],
  backups: [],
  stats: null,
  status: 'idle',
  error: null,
};

export const fetchFiles = createAsyncThunk(
  'storage/fetchFiles',
  async (path: string) => {
    return await storageService.listFiles(path);
  }
);

export const fetchBackups = createAsyncThunk(
  'storage/fetchBackups',
  async () => {
    return await storageService.listBackups();
  }
);

export const fetchStats = createAsyncThunk(
  'storage/fetchStats',
  async () => {
    return await storageService.getStorageStats();
  }
);

export const uploadFiles = createAsyncThunk(
  'storage/uploadFiles',
  async ({ files, path }: { files: File[]; path: string }) => {
    return await storageService.uploadMultipleFiles(files, path);
  }
);

export const deleteFiles = createAsyncThunk(
  'storage/deleteFiles',
  async (paths: string[]) => {
    await storageService.deleteMultipleFiles(paths);
    return paths;
  }
);

export const createBackup = createAsyncThunk(
  'storage/createBackup',
  async ({ files, timestamp }: { files: File[]; timestamp: string }) => {
    return await storageService.createBackup(files, timestamp);
  }
);

export const cleanupBackups = createAsyncThunk(
  'storage/cleanupBackups',
  async () => {
    await storageService.cleanupOldBackups();
  }
);

const storageSlice = createSlice({
  name: 'storage',
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Files
      .addCase(fetchFiles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch files';
      })

      // Fetch Backups
      .addCase(fetchBackups.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBackups.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.backups = action.payload;
      })
      .addCase(fetchBackups.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch backups';
      })

      // Fetch Stats
      .addCase(fetchStats.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch stats';
      })

      // Upload Files
      .addCase(uploadFiles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(uploadFiles.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to upload files';
      })

      // Delete Files
      .addCase(deleteFiles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteFiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.files = state.files.filter(
          file => !action.payload.includes(file.path)
        );
      })
      .addCase(deleteFiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to delete files';
      })

      // Create Backup
      .addCase(createBackup.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createBackup.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(createBackup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to create backup';
      })

      // Cleanup Backups
      .addCase(cleanupBackups.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(cleanupBackups.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(cleanupBackups.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to cleanup backups';
      });
  },
});

export const { resetStatus } = storageSlice.actions;
export default storageSlice.reducer;
