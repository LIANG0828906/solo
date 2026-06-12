import { io, Socket } from 'socket.io-client';
import type { OTAction, CursorPosition, VersionSnapshot, User, DocumentState } from '../../shared/types';

type EventCallback = (...args: any[]) => void;

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io({
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connect error:', error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      this.socket.on('reconnect_attempt', () => {
        this.reconnectAttempts++;
        console.log(`Reconnect attempt ${this.reconnectAttempts}`);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      this.socket.onAny((eventName, ...args) => {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
          callbacks.forEach(cb => cb(...args));
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

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  joinDocument(docId: string, userId: string, userName: string): void {
    this.emit('doc:join', { docId, userId, userName });
  }

  sendAction(action: OTAction): void {
    this.emit('doc:action', action);
  }

  sendCursor(cursor: CursorPosition): void {
    this.emit('doc:cursor', cursor);
  }

  saveDocument(label?: string): void {
    this.emit('doc:save', { label });
  }

  restoreVersion(versionId: string): void {
    this.emit('doc:restore-version', { versionId });
  }
}

export const socketClient = new SocketClient();
export default socketClient;
