import { io, Socket } from 'socket.io-client';
import { User, LyricLine, TextOperation, Timestamp } from '../types';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Socket {
    if (this.socket) return this.socket;

    this.socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connect error:', err);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinRoom(roomId: string, user: User) {
    this.connect().emit('join-room', { roomId, user });
  }

  leaveRoom(roomId: string, userId: string) {
    this.socket?.emit('leave-room', { roomId, userId });
  }

  sendOperation(roomId: string, operation: TextOperation) {
    this.socket?.emit('text-operation', { roomId, operation });
  }

  sendCursor(roomId: string, userId: string, position: { lineIndex: number; charIndex: number }) {
    this.socket?.emit('cursor-update', { roomId, userId, position });
  }

  addTimestamp(roomId: string, timestamp: Timestamp) {
    this.socket?.emit('timestamp-add', { roomId, timestamp });
  }

  updateTimestamp(roomId: string, timestamp: Timestamp) {
    this.socket?.emit('timestamp-update', { roomId, timestamp });
  }

  removeTimestamp(roomId: string, timestampId: string, lineIndex: number) {
    this.socket?.emit('timestamp-remove', { roomId, timestampId, lineIndex });
  }

  onRoomJoined(callback: (state: { lines: LyricLine[]; users: User[]; version: number }) => void) {
    this.connect().on('room-joined', callback);
  }

  onUserJoined(callback: (users: User[]) => void) {
    this.connect().on('user-joined', callback);
  }

  onUserLeft(callback: (users: User[]) => void) {
    this.connect().on('user-left', callback);
  }

  onTextOperation(callback: (operation: TextOperation) => void) {
    this.connect().on('text-operation', callback);
  }

  onCursorUpdate(callback: (cursors: Record<string, { lineIndex: number; charIndex: number; user: User }>) => void) {
    this.connect().on('cursor-update-broadcast', callback);
  }

  onTimestampAdded(callback: (timestamp: Timestamp) => void) {
    this.connect().on('timestamp-added', callback);
  }

  onTimestampUpdated(callback: (timestamp: Timestamp) => void) {
    this.connect().on('timestamp-updated', callback);
  }

  onTimestampRemoved(callback: (data: { timestampId: string; lineIndex: number }) => void) {
    this.connect().on('timestamp-removed', callback);
  }

  offAll() {
    if (this.socket) {
      this.socket.off('room-joined');
      this.socket.off('user-joined');
      this.socket.off('user-left');
      this.socket.off('text-operation');
      this.socket.off('cursor-update-broadcast');
      this.socket.off('timestamp-added');
      this.socket.off('timestamp-updated');
      this.socket.off('timestamp-removed');
    }
  }
}

export const socketClient = new SocketClient();
