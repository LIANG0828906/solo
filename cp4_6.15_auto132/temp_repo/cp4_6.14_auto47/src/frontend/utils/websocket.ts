import { io, Socket } from 'socket.io-client';
import { Layer, User, RoomState } from '../../shared/types';

class WebSocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private currentUser: User | null = null;

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  connect(): void {
    if (this.socket?.connected) return;
    this.socket = io({
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.emit('connected', null);
    });

    this.socket.on('disconnect', () => {
      this.emit('disconnected', null);
    });

    this.socket.on('current-user', (user: User) => {
      this.currentUser = user;
      this.emit('current-user', user);
    });

    this.socket.on('room-state', (state: RoomState) => {
      this.emit('room-state', state);
    });

    this.socket.on('user-joined', (user: User) => {
      this.emit('user-joined', user);
    });

    this.socket.on('user-left', (userId: string) => {
      this.emit('user-left', userId);
    });

    this.socket.on('users-update', (users: User[]) => {
      this.emit('users-update', users);
    });

    this.socket.on('cursor-update', (user: User) => {
      this.emit('cursor-update', user);
    });

    this.socket.on('layers-update', (layers: Layer[]) => {
      this.emit('layers-update', layers);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string, userName: string): void {
    if (this.socket) {
      this.socket.emit('join-room', roomId, userName);
    }
  }

  sendCursorPosition(x: number, y: number): void {
    if (this.socket) {
      this.socket.emit('cursor-move', x, y);
    }
  }

  addLayer(layer: Layer): void {
    if (this.socket) {
      this.socket.emit('add-layer', layer);
    }
  }

  updateLayer(layerId: string, updates: Partial<Layer>): void {
    if (this.socket) {
      this.socket.emit('update-layer', layerId, updates);
    }
  }

  deleteLayer(layerId: string): void {
    if (this.socket) {
      this.socket.emit('delete-layer', layerId);
    }
  }

  reorderLayer(layerId: string, newIndex: number): void {
    if (this.socket) {
      this.socket.emit('reorder-layer', layerId, newIndex);
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsManager = new WebSocketManager();
