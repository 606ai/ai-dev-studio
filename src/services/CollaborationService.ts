import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'code';
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  messages: Message[];
  document: string;
  language: string;
}

export class CollaborationService extends EventEmitter {
  private socket: Socket;
  private ydoc: Y.Doc;
  private provider: WebsocketProvider;
  private binding: MonacoBinding | null = null;
  private currentUser: User;
  private currentRoom: string | null = null;
  private awareness: Map<string, User> = new Map();

  constructor(serverUrl: string, user: User) {
    super();
    this.currentUser = user;
    this.socket = io(serverUrl);
    this.ydoc = new Y.Doc();
    this.provider = new WebsocketProvider(serverUrl, 'monaco-demo', this.ydoc);

    this.setupSocketListeners();
    this.setupAwarenessProtocol();
  }

  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      this.emit('disconnected');
    });

    this.socket.on('userJoined', (user: User) => {
      this.awareness.set(user.id, user);
      this.emit('userJoined', user);
    });

    this.socket.on('userLeft', (userId: string) => {
      this.awareness.delete(userId);
      this.emit('userLeft', userId);
    });

    this.socket.on('cursorMoved', ({ userId, cursor }) => {
      const user = this.awareness.get(userId);
      if (user) {
        user.cursor = cursor;
        this.emit('cursorMoved', { userId, cursor });
      }
    });

    this.socket.on('message', (message: Message) => {
      this.emit('message', message);
    });
  }

  private setupAwarenessProtocol(): void {
    this.provider.awareness.setLocalState({
      user: this.currentUser,
      cursor: null
    });

    this.provider.awareness.on('change', () => {
      const states = this.provider.awareness.getStates();
      states.forEach((state: any, clientId: number) => {
        if (state.user && state.user.id !== this.currentUser.id) {
          this.awareness.set(state.user.id, {
            ...state.user,
            cursor: state.cursor
          });
        }
      });
      this.emit('awarenessChange', Array.from(this.awareness.values()));
    });
  }

  public async joinRoom(roomId: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      this.socket.emit('joinRoom', { roomId, user: this.currentUser }, (response: { success: boolean; room?: Room; error?: string }) => {
        if (response.success && response.room) {
          this.currentRoom = roomId;
          resolve(response.room);
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  public leaveRoom(): void {
    if (this.currentRoom) {
      this.socket.emit('leaveRoom', { roomId: this.currentRoom, userId: this.currentUser.id });
      this.currentRoom = null;
    }
  }

  public bindEditor(editor: monaco.editor.IStandaloneCodeEditor): void {
    const ytext = this.ydoc.getText('monaco');
    this.binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      this.provider.awareness
    );

    editor.onDidChangeCursorPosition(e => {
      if (this.currentRoom) {
        this.socket.emit('cursorMove', {
          roomId: this.currentRoom,
          userId: this.currentUser.id,
          cursor: {
            line: e.position.lineNumber,
            column: e.position.column
          }
        });
      }
    });
  }

  public unbindEditor(): void {
    if (this.binding) {
      this.binding.destroy();
      this.binding = null;
    }
  }

  public sendMessage(content: string, type: 'text' | 'system' | 'code' = 'text'): void {
    if (!this.currentRoom) return;

    const message: Message = {
      id: uuidv4(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      content,
      timestamp: Date.now(),
      type
    };

    this.socket.emit('message', {
      roomId: this.currentRoom,
      message
    });
  }

  public updateCursor(line: number, column: number): void {
    if (!this.currentRoom) return;

    this.socket.emit('cursorMove', {
      roomId: this.currentRoom,
      userId: this.currentUser.id,
      cursor: { line, column }
    });
  }

  public getConnectedUsers(): User[] {
    return Array.from(this.awareness.values());
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  public isConnected(): boolean {
    return this.socket.connected;
  }

  public dispose(): void {
    this.unbindEditor();
    this.provider.destroy();
    this.socket.disconnect();
    this.removeAllListeners();
  }
}

export default CollaborationService;
