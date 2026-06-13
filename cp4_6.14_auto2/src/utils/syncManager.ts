import { io, Socket } from 'socket.io-client';
import type { DrawEvent, Point } from './drawEngine';

export interface User {
  id: string;
  username: string;
  color: string;
}

export interface CursorData {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
}

export interface SyncCallbacks {
  onUserJoined?: (user: User) => void;
  onUserLeft?: (userId: string) => void;
  onUsersUpdate?: (users: User[]) => void;
  onDraw?: (event: DrawEvent) => void;
  onCursor?: (data: CursorData) => void;
  onDrawHistory?: (events: DrawEvent[]) => void;
  onStickyUpdate?: (data: any) => void;
  onUndo?: (userId: string) => void;
  onRedo?: (userId: string) => void;
}

export class SyncManager {
  private socket: Socket | null = null;
  private callbacks: SyncCallbacks = {};

  connect(url: string, username: string, color: string): Promise<User> {
    return new Promise((resolve, reject) => {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        this.socket!.emit('join', { username, color });
      });

      this.socket.on('joined', (user: User, history: DrawEvent[]) => {
        if (this.callbacks.onDrawHistory) {
          this.callbacks.onDrawHistory(history);
        }
        resolve(user);
      });

      this.socket.on('connect_error', (err: Error) => {
        reject(err);
      });

      this.socket.on('users', (users: User[]) => {
        if (this.callbacks.onUsersUpdate) {
          this.callbacks.onUsersUpdate(users);
        }
      });

      this.socket.on('userJoined', (user: User) => {
        if (this.callbacks.onUserJoined) {
          this.callbacks.onUserJoined(user);
        }
      });

      this.socket.on('userLeft', (userId: string) => {
        if (this.callbacks.onUserLeft) {
          this.callbacks.onUserLeft(userId);
        }
      });

      this.socket.on('draw', (event: DrawEvent) => {
        if (this.callbacks.onDraw) {
          this.callbacks.onDraw(event);
        }
      });

      this.socket.on('cursor', (data: CursorData) => {
        if (this.callbacks.onCursor) {
          this.callbacks.onCursor(data);
        }
      });

      this.socket.on('stickyUpdate', (data: any) => {
        if (this.callbacks.onStickyUpdate) {
          this.callbacks.onStickyUpdate(data);
        }
      });

      this.socket.on('undo', (userId: string) => {
        if (this.callbacks.onUndo) {
          this.callbacks.onUndo(userId);
        }
      });

      this.socket.on('redo', (userId: string) => {
        if (this.callbacks.onRedo) {
          this.callbacks.onRedo(userId);
        }
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setCallbacks(callbacks: SyncCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  sendDraw(event: DrawEvent): void {
    if (this.socket?.connected) {
      this.socket.emit('draw', event);
    }
  }

  sendCursor(x: number, y: number, username: string, color: string): void {
    if (this.socket?.connected) {
      this.socket.emit('cursor', { x, y, username, color });
    }
  }

  sendSticky(data: any): void {
    if (this.socket?.connected) {
      this.socket.emit('stickyUpdate', data);
    }
  }

  sendUndo(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('undo', userId);
    }
  }

  sendRedo(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('redo', userId);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const syncManager = new SyncManager();
