import { Server } from 'socket.io';
import http from 'http';
import config from '../config';
import logger from '../utils/logger';
import { verifyToken } from '../utils/auth';

interface VersionStatus {
  modelId: string;
  versionId: string;
  status: string;
  metrics?: any;
}

interface DeploymentStatus {
  modelId: string;
  deploymentId: string;
  status: string;
  metrics?: any;
}

export interface ServerToClientEvents {
  'user:update': (user: any) => void;
  'cursor:update': (cursor: any) => void;
  'change:update': (change: any) => void;
  'comment:update': (data: any) => void;
  'model:metrics': (data: any) => void;
  'system:metrics': (metrics: any) => void;
  'deployment:status': (status: any) => void;
  'training:progress': (progress: any) => void;
  'version:status': (status: VersionStatus) => void;
  error: (error: string) => void;
}

export interface ClientToServerEvents {
  'cursor:move': (cursor: any) => void;
  'change:submit': (change: any) => void;
  'comment:add': (comment: any) => void;
  'metrics:subscribe': (modelId: string) => void;
  'metrics:unsubscribe': (modelId: string) => void;
  'join:model': (modelId: string) => void;
  'leave:model': (modelId: string) => void;
}

class WebSocketService {
  private static instance: WebSocketService;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private modelRooms: Map<string, Set<string>> = new Map();

  private constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: config.CORS_ORIGIN,
        methods: ['GET', 'POST'],
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  public static getInstance(server?: http.Server): WebSocketService {
    if (!WebSocketService.instance && server) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = await verifyToken(token);
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join user-specific room
      const userId = socket.data.user.id;
      socket.join(`user:${userId}`);

      socket.on('join:model', (modelId: string) => {
        this.joinModelRoom(socket.id, modelId);
        logger.info(`Client ${socket.id} joined model room: ${modelId}`);
      });

      socket.on('leave:model', (modelId: string) => {
        this.leaveModelRoom(socket.id, modelId);
        logger.info(`Client ${socket.id} left model room: ${modelId}`);
      });

      // Handle cursor movement
      socket.on('cursor:move', (cursor) => {
        socket.broadcast.emit('cursor:update', {
          ...cursor,
          userId: socket.data.user.id,
        });
      });

      // Handle change submission
      socket.on('change:submit', async (change) => {
        try {
          // Process change and broadcast to relevant users
          this.io.emit('change:update', {
            ...change,
            userId: socket.data.user.id,
          });
        } catch (error) {
          socket.emit('error', 'Failed to process change');
        }
      });

      // Handle comment addition
      socket.on('comment:add', async (comment) => {
        try {
          // Process comment and broadcast to relevant users
          this.io.emit('comment:update', {
            comment: {
              ...comment,
              userId: socket.data.user.id,
            },
          });
        } catch (error) {
          socket.emit('error', 'Failed to add comment');
        }
      });

      // Handle metrics subscription
      socket.on('metrics:subscribe', (modelId) => {
        socket.join(`model:${modelId}`);
      });

      // Handle metrics unsubscription
      socket.on('metrics:unsubscribe', (modelId) => {
        socket.leave(`model:${modelId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket.id);
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private joinModelRoom(socketId: string, modelId: string): void {
    if (!this.modelRooms.has(modelId)) {
      this.modelRooms.set(modelId, new Set());
    }
    this.modelRooms.get(modelId)!.add(socketId);
    this.io.sockets.sockets.get(socketId)?.join(`model:${modelId}`);
  }

  private leaveModelRoom(socketId: string, modelId: string): void {
    this.modelRooms.get(modelId)?.delete(socketId);
    this.io.sockets.sockets.get(socketId)?.leave(`model:${modelId}`);
    if (this.modelRooms.get(modelId)?.size === 0) {
      this.modelRooms.delete(modelId);
    }
  }

  private handleDisconnect(socketId: string): void {
    for (const [modelId, clients] of this.modelRooms.entries()) {
      if (clients.has(socketId)) {
        this.leaveModelRoom(socketId, modelId);
      }
    }
  }

  public broadcastModelMetrics(modelId: string, metrics: any): void {
    this.io.to(`model:${modelId}`).emit('model:metrics', metrics);
  }

  public broadcastSystemMetrics(metrics: any): void {
    this.io.emit('system:metrics', metrics);
  }

  public broadcastDeploymentStatus(modelId: string, status: any): void {
    this.io.to(`model:${modelId}`).emit('deployment:status', status);
  }

  public broadcastTrainingProgress(modelId: string, progress: any): void {
    this.io.to(`model:${modelId}`).emit('training:progress', progress);
  }

  public broadcastVersionStatus(modelId: string, status: VersionStatus): void {
    this.io.to(`model:${modelId}`).emit('version:status', status);
  }

  public notifyUser(userId: string, event: keyof ServerToClientEvents, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public broadcastToRoom(room: string, event: keyof ServerToClientEvents, data: any): void {
    this.io.to(room).emit(event, data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.io.sockets.sockets.keys());
  }

  public getConnectedClients(modelId: string): number {
    return this.modelRooms.get(modelId)?.size || 0;
  }

  public getAllConnectedClients(): number {
    return this.io.engine.clientsCount;
  }
}

export default WebSocketService;
