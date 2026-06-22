import { io, Socket } from 'socket.io-client';
import type { SocketEventHandler, SocketServiceInterface } from './types';

class SocketService implements SocketServiceInterface {
  private socket: Socket | null = null;
  private mockMode = true;
  private mockHandlers: Map<string, Set<SocketEventHandler>> = new Map();
  private connected = false;

  connect(): void {
    if (this.mockMode) {
      setTimeout(() => {
        this.connected = true;
        this.emitMock('connect', null);
      }, 100);
      return;
    }

    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });
  }

  disconnect(): void {
    if (this.mockMode) {
      this.connected = false;
      this.emitMock('disconnect', null);
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }

  on(event: string, handler: SocketEventHandler): () => void {
    if (this.mockMode) {
      if (!this.mockHandlers.has(event)) {
        this.mockHandlers.set(event, new Set());
      }
      this.mockHandlers.get(event)!.add(handler);
      return () => {
        this.mockHandlers.get(event)?.delete(handler);
      };
    }

    if (this.socket) {
      this.socket.on(event, handler);
      return () => {
        this.socket?.off(event, handler);
      };
    }

    return () => {};
  }

  emit(event: string, data: unknown): void {
    if (this.mockMode) {
      setTimeout(() => {
        if (event === 'event:update' || event === 'score:update') {
          this.emitMock(event === 'event:update' ? 'event:sync' : 'score:sync', data);
        }
      }, 50);
      return;
    }

    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private emitMock(event: string, data: unknown): void {
    const handlers = this.mockHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error('Socket handler error:', e);
        }
      });
    }
  }
}

export const socketService = new SocketService();
