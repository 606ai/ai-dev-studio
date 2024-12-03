import winston from 'winston';
import 'winston-daily-rotate-file';
import { Request, Response } from 'express';
import path from 'path';
import LogAggregator from './logAggregator';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Custom format for logging
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Create transports for different log destinations
const transports = [
  new winston.transports.Console(),
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  new winston.transports.DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Create a stream object for Morgan integration
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
    );
  });
  next();
};

// Error logging function
export const logError = (error: Error, context?: string) => {
  logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
    stack: error.stack,
    name: error.name,
  });
};

// Performance logging function
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>,
) => {
  logger.info(`Performance - ${operation}: ${duration}ms`, metadata);
};

// Audit logging function
export const logAudit = (
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>,
) => {
  logger.info(`Audit - User ${userId} ${action} ${resource}`, {
    userId,
    action,
    resource,
    ...details,
  });
};

// Add structured logging context
interface LogContext {
  service?: string;
  traceId?: string;
  userId?: string;
  [key: string]: any;
}

class StructuredLogger {
  private context: LogContext = {};
  private logAggregator: LogAggregator;

  constructor() {
    this.logAggregator = LogAggregator.getInstance();
  }

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private async formatAndIndexLog(level: string, message: string, meta?: any) {
    const formattedLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...meta
    };

    // Log to Winston
    logger[level](formattedLog);

    // Index in Elasticsearch
    await this.logAggregator.indexLog(formattedLog);
  }

  async info(message: string, meta?: any) {
    await this.formatAndIndexLog('info', message, meta);
  }

  async error(message: string, meta?: any) {
    await this.formatAndIndexLog('error', message, meta);
  }

  async warn(message: string, meta?: any) {
    await this.formatAndIndexLog('warn', message, meta);
  }

  async debug(message: string, meta?: any) {
    await this.formatAndIndexLog('debug', message, meta);
  }

  async http(message: string, meta?: any) {
    await this.formatAndIndexLog('http', message, meta);
  }
}

export const structuredLogger = new StructuredLogger();
