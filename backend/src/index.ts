import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import config from './config';
import { logger, requestLogger, stream } from './monitoring/logger';
import WebSocketService from './services/websocket';
import QueueService from './services/queue';
import CacheService from './services/cache';

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(helmet());
app.use(requestLogger);  // Add request logging
app.use(morgan('combined', { stream }));  // Configure morgan with our logger
app.use(express.json({ limit: config.MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true }));

// Initialize Services
async function initializeServices() {
  try {
    logger.info('Initializing services...');
    // Initialize WebSocket
    WebSocketService.getInstance(server);

    // Initialize Queue Service
    const queueService = QueueService.getInstance();
    await queueService.connect();

    // Initialize Cache Service
    const cacheService = CacheService.getInstance();
    await cacheService.connect();

    // Connect to Database
    await prisma.$connect();

    logger.info('Services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// API Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start Server
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  try {
    // Close WebSocket connections
    server.close();

    // Close Queue connections
    await QueueService.getInstance().close();

    // Close Cache connections
    await CacheService.getInstance().disconnect();

    // Close Database connections
    await prisma.$disconnect();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

startServer();
