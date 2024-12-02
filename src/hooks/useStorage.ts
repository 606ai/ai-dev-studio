import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchFiles,
  fetchBackups,
  fetchStats,
  uploadFiles,
  deleteFiles,
  createBackup,
  cleanupBackups,
} from '../store/slices/storageSlice';
import { StorageItem } from '../services/storage';

export const useStorage = () => {
  const dispatch = useAppDispatch();
  const {
    files,
    backups,
    stats,
    status,
    error,
  } = useAppSelector((state) => state.storage);

  const loadFiles = useCallback(
    (path: string) => dispatch(fetchFiles(path)),
    [dispatch]
  );

  const loadBackups = useCallback(
    () => dispatch(fetchBackups()),
    [dispatch]
  );

  const loadStats = useCallback(
    () => dispatch(fetchStats()),
    [dispatch]
  );

  const upload = useCallback(
    (files: File[], path: string) => dispatch(uploadFiles({ files, path })),
    [dispatch]
  );

  const remove = useCallback(
    (paths: string[]) => dispatch(deleteFiles(paths)),
    [dispatch]
  );

  const backup = useCallback(
    (files: File[]) => {
      const timestamp = new Date().toISOString();
      return dispatch(createBackup({ files, timestamp }));
    },
    [dispatch]
  );

  const cleanup = useCallback(
    () => dispatch(cleanupBackups()),
    [dispatch]
  );

  const formatSize = useCallback((bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }, []);

  const getFileIcon = useCallback((file: StorageItem): string => {
    const type = file.type.toLowerCase();
    
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    if (type.includes('text')) return '📝';
    if (type.includes('json')) return '{ }';
    if (type.includes('javascript') || type.includes('typescript')) return '📜';
    
    return '📄';
  }, []);

  const isLoading = status === 'loading';
  const isError = status === 'failed';
  const isSuccess = status === 'succeeded';

  return {
    // State
    files,
    backups,
    stats,
    status,
    error,
    isLoading,
    isError,
    isSuccess,

    // Actions
    loadFiles,
    loadBackups,
    loadStats,
    upload,
    remove,
    backup,
    cleanup,

    // Utilities
    formatSize,
    getFileIcon,
  };
};
