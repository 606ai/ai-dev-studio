import { io, Socket } from 'socket.io-client';
import { logError, logInfo } from '@utils/logger';

interface CollaborationEvent {
  type: 'cursor' | 'edit' | 'selection';
  data: any;
  userId: string;
  timestamp: number;
}

class CollaborationService {
  private static instance: CollaborationService;
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private userId: string;
  private eventHandlers: Map<string, ((event: CollaborationEvent) => void)[]> = new Map();

  private constructor() {
    this.userId = crypto.randomUUID();
  }

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          transports: ['websocket'],
          auth: {
            userId: this.userId,
          },
        });

        this.socket.on('connect', () => {
          logInfo('Collaboration service connected');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          logError('Collaboration connection error', error);
          reject(error);
        });

        this.setupEventListeners();
      } catch (error) {
        logError('Failed to initialize collaboration service', error);
        reject(error);
      }
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('collaboration_event', (event: CollaborationEvent) => {
      if (event.userId === this.userId) return; // Ignore own events

      const handlers = this.eventHandlers.get(event.type) || [];
      handlers.forEach(handler => handler(event));
    });

    this.socket.on('disconnect', () => {
      logInfo('Disconnected from collaboration service');
    });

    this.socket.on('error', (error) => {
      logError('Collaboration service error', error);
    });
  }

  joinRoom(roomId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('join_room', { roomId });
    this.roomId = roomId;
  }

  leaveRoom(): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('leave_room', { roomId: this.roomId });
    this.roomId = null;
  }

  broadcastEvent(type: string, data: any): void {
    if (!this.socket || !this.roomId) {
      throw new Error('Not connected to a room');
    }

    const event: CollaborationEvent = {
      type: type as 'cursor' | 'edit' | 'selection',
      data,
      userId: this.userId,
      timestamp: Date.now(),
    };

    this.socket.emit('collaboration_event', event);
  }

  on(eventType: string, handler: (event: CollaborationEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  off(eventType: string, handler: (event: CollaborationEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(eventType, handlers);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get currentRoom(): string | null {
    return this.roomId;
  }
}

export const collaborationService = CollaborationService.getInstance();
