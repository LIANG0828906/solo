import { io, type Socket } from 'socket.io-client';
import type { Shape, StickyNote, User, RoomState } from '../types';

type EventHandler<T = unknown> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io({
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      this.socket.onAny((eventName, ...args) => {
        const handlers = this.listeners.get(eventName);
        if (handlers) {
          handlers.forEach((handler) => handler(args[0]));
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

  subscribe<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);

    return () => {
      this.listeners.get(event)?.delete(handler as EventHandler);
    };
  }

  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  joinRoom(roomId: string, userName: string): void {
    this.emit('room:join', { roomId, userName });
  }

  onRoomState(handler: EventHandler<RoomState>): () => void {
    return this.subscribe('room:state', handler);
  }

  onSelfUser(handler: EventHandler<User>): () => void {
    return this.subscribe('user:self', handler);
  }

  onUserJoin(handler: EventHandler<User>): () => void {
    return this.subscribe('user:join', handler);
  }

  onUserLeave(handler: EventHandler<string>): () => void {
    return this.subscribe('user:leave', handler);
  }

  onShapeAdd(handler: EventHandler<Shape>): () => void {
    return this.subscribe('shape:add', handler);
  }

  onShapeUpdate(handler: EventHandler<Shape>): () => void {
    return this.subscribe('shape:update', handler);
  }

  onShapeDelete(handler: EventHandler<string>): () => void {
    return this.subscribe('shape:delete', handler);
  }

  onStickyAdd(handler: EventHandler<StickyNote>): () => void {
    return this.subscribe('sticky:add', handler);
  }

  onStickyUpdate(handler: EventHandler<StickyNote>): () => void {
    return this.subscribe('sticky:update', handler);
  }

  onStickyDelete(handler: EventHandler<string>): () => void {
    return this.subscribe('sticky:delete', handler);
  }

  addShape(shape: Shape): void {
    this.emit('shape:add', shape);
  }

  updateShape(shape: Shape): void {
    this.emit('shape:update', shape);
  }

  deleteShape(shapeId: string): void {
    this.emit('shape:delete', shapeId);
  }

  addSticky(sticky: StickyNote): void {
    this.emit('sticky:add', sticky);
  }

  updateSticky(sticky: StickyNote): void {
    this.emit('sticky:update', sticky);
  }

  deleteSticky(stickyId: string): void {
    this.emit('sticky:delete', stickyId);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
