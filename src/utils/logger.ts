type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

const MAX_LOG_SIZE = 1000;
const logQueue: LogEntry[] = [];

// In production, this could be replaced with a proper logging service
const isProd = process.env.NODE_ENV === 'production';

const formatLogEntry = (level: LogLevel, message: string, data?: any): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  data,
});

const sendToLoggingService = async (entry: LogEntry) => {
  if (isProd) {
    try {
      // TODO: Replace with your actual logging service
      // await fetch('your-logging-endpoint', {
      //   method: 'POST',
      //   body: JSON.stringify(entry),
      // });
      
      // For now, just console log in production
      console[entry.level](entry.message, entry.data);
    } catch (error) {
      console.error('Failed to send log to service:', error);
    }
  }
};

const addToQueue = (entry: LogEntry) => {
  logQueue.push(entry);
  if (logQueue.length > MAX_LOG_SIZE) {
    logQueue.shift();
  }
};

export const logInfo = (message: string, data?: any) => {
  const entry = formatLogEntry('info', message, data);
  addToQueue(entry);
  if (!isProd) {
    console.info(message, data);
  }
  sendToLoggingService(entry);
};

export const logWarn = (message: string, data?: any) => {
  const entry = formatLogEntry('warn', message, data);
  addToQueue(entry);
  if (!isProd) {
    console.warn(message, data);
  }
  sendToLoggingService(entry);
};

export const logError = (message: string, data?: any) => {
  const entry = formatLogEntry('error', message, data);
  addToQueue(entry);
  console.error(message, data); // Always log errors
  sendToLoggingService(entry);
};

export const logDebug = (message: string, data?: any) => {
  if (!isProd) {
    const entry = formatLogEntry('debug', message, data);
    addToQueue(entry);
    console.debug(message, data);
  }
};

export const getLogs = () => [...logQueue];

export const clearLogs = () => {
  logQueue.length = 0;
};
