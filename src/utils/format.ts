/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format date to human readable string
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format number with appropriate suffix (K, M, B)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file path for display
 */
export function formatPath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) {
    return path;
  }

  const parts = path.split('/');
  const filename = parts.pop() || '';
  let result = filename;
  let index = parts.length - 1;

  while (index >= 0 && result.length < maxLength - 3) {
    result = `${parts[index]}/${result}`;
    index--;
  }

  return result.length > maxLength ? `...${result.slice(-maxLength + 3)}` : `.../${result}`;
}

/**
 * Format error message for display
 */
export function formatError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

/**
 * Format transfer speed
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s remaining`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m remaining`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  }
}

/**
 * Format file extension
 */
export function formatExtension(filename: string): string {
  const ext = filename.split('.').pop();
  return ext ? `.${ext.toLowerCase()}` : '';
}

/**
 * Format file size with appropriate units and colors
 */
export function formatFileSize(
  bytes: number,
  { colors = false }: { colors?: boolean } = {}
): string {
  const size = formatBytes(bytes);
  
  if (!colors) {
    return size;
  }

  // Add color coding based on size
  if (bytes >= 100 * 1024 * 1024) { // 100MB
    return `\x1b[31m${size}\x1b[0m`; // Red
  } else if (bytes >= 10 * 1024 * 1024) { // 10MB
    return `\x1b[33m${size}\x1b[0m`; // Yellow
  } else {
    return `\x1b[32m${size}\x1b[0m`; // Green
  }
}
