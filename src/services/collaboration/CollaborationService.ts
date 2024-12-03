import { EventEmitter } from 'events';
import ApiGateway from '../gateway/ApiGateway';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline';
  lastSeen?: Date;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  file?: string;
  line?: number;
  createdAt: Date;
  updatedAt?: Date;
  reactions: Array<{
    type: string;
    users: string[];
  }>;
  replies: Comment[];
}

export interface Change {
  id: string;
  userId: string;
  file: string;
  type: 'add' | 'modify' | 'delete';
  content: string;
  diff?: string;
  timestamp: Date;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewers: string[];
  comments: Comment[];
}

export interface Cursor {
  userId: string;
  file: string;
  position: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

class CollaborationService extends EventEmitter {
  private static instance: CollaborationService;
  private api: ApiGateway;
  private wsConnection: WebSocket | null;
  private users: Map<string, User>;
  private changes: Map<string, Change>;
  private cursors: Map<string, Cursor>;

  private constructor() {
    super();
    this.api = ApiGateway.getInstance();
    this.wsConnection = null;
    this.users = new Map();
    this.changes = new Map();
    this.cursors = new Map();
    this.initializeWebSocket();
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  private initializeWebSocket() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'USER_JOINED':
        case 'USER_LEFT':
        case 'USER_UPDATED':
          this.handleUserUpdate(data.payload);
          break;
        case 'CURSOR_MOVED':
          this.handleCursorUpdate(data.payload);
          break;
        case 'CHANGE_SUBMITTED':
        case 'CHANGE_UPDATED':
          this.handleChangeUpdate(data.payload);
          break;
        case 'COMMENT_ADDED':
        case 'COMMENT_UPDATED':
          this.handleCommentUpdate(data.payload);
          break;
      }
    };

    this.wsConnection.onclose = () => {
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  private handleUserUpdate(user: User) {
    this.users.set(user.id, user);
    this.emit('userUpdated', user);
  }

  private handleCursorUpdate(cursor: Cursor) {
    this.cursors.set(cursor.userId, cursor);
    this.emit('cursorMoved', cursor);
  }

  private handleChangeUpdate(change: Change) {
    this.changes.set(change.id, change);
    this.emit('changeUpdated', change);
  }

  private handleCommentUpdate(data: {
    changeId: string;
    comment: Comment;
  }) {
    const change = this.changes.get(data.changeId);
    if (change) {
      // Update comment in change
      this.handleChangeUpdate(change);
    }
    this.emit('commentUpdated', data);
  }

  public async getCollaborators(modelId: string): Promise<User[]> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.getCollaborators(modelId);
      const users = response.data;
      users.forEach((user: User) => this.users.set(user.id, user));
      return users;
    });
  }

  public async inviteCollaborator(
    modelId: string,
    email: string,
    role: User['role']
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/collaboration/${modelId}/invite`, {
        email,
        role,
      });
    });
  }

  public async updateCollaboratorRole(
    modelId: string,
    userId: string,
    role: User['role']
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.put(`/collaboration/${modelId}/users/${userId}`, {
        role,
      });
    });
  }

  public async removeCollaborator(
    modelId: string,
    userId: string
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.delete(
        `/collaboration/${modelId}/users/${userId}`
      );
    });
  }

  public async submitChange(change: Omit<Change, 'id'>): Promise<Change> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post('/collaboration/changes', change);
      const newChange = response.data;
      this.changes.set(newChange.id, newChange);
      return newChange;
    });
  }

  public async approveChange(changeId: string): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/collaboration/changes/${changeId}/approve`);
    });
  }

  public async rejectChange(
    changeId: string,
    reason: string
  ): Promise<void> {
    return this.api.withErrorHandling(async () => {
      await this.api.client.post(`/collaboration/changes/${changeId}/reject`, {
        reason,
      });
    });
  }

  public async addComment(
    changeId: string,
    comment: Omit<Comment, 'id' | 'createdAt' | 'reactions' | 'replies'>
  ): Promise<Comment> {
    return this.api.withErrorHandling(async () => {
      const response = await this.api.client.post(
        `/collaboration/changes/${changeId}/comments`,
        comment
      );
      return response.data;
    });
  }

  public async updateCursor(cursor: Omit<Cursor, 'userId'>): Promise<void> {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(
        JSON.stringify({
          type: 'CURSOR_UPDATE',
          payload: cursor,
        })
      );
    }
  }

  public subscribeToUserUpdates(
    callback: (user: User) => void
  ): () => void {
    this.on('userUpdated', callback);
    return () => this.off('userUpdated', callback);
  }

  public subscribeToCursorUpdates(
    callback: (cursor: Cursor) => void
  ): () => void {
    this.on('cursorMoved', callback);
    return () => this.off('cursorMoved', callback);
  }

  public subscribeToChangeUpdates(
    callback: (change: Change) => void
  ): () => void {
    this.on('changeUpdated', callback);
    return () => this.off('changeUpdated', callback);
  }

  public subscribeToCommentUpdates(
    callback: (data: { changeId: string; comment: Comment }) => void
  ): () => void {
    this.on('commentUpdated', callback);
    return () => this.off('commentUpdated', callback);
  }

  public dispose() {
    this.wsConnection?.close();
    this.removeAllListeners();
  }
}

export default CollaborationService;
