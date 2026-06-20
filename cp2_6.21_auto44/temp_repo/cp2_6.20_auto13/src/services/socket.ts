import { io, Socket } from 'socket.io-client';
import type { Collaborator, VersionSnapshot } from '@/types';

interface OpLog {
  type: 'insert' | 'update' | 'delete' | 'reorder';
  section: 'ingredient' | 'step' | 'meta';
  id: string;
  data?: Record<string, unknown>;
  order?: number;
}

interface CursorPos {
  section: string;
  id: string;
}

type OpHandler = (op: OpLog, fromUserId: string) => void;
type CursorHandler = (userId: string, position: CursorPos) => void;
type UserHandler = (user: Collaborator) => void;
type ConflictHandler = (localOp: OpLog, remoteOp: OpLog) => void;
type VersionHandler = (snapshot: VersionSnapshot) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private currentRoom: string | null = null;

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io('/ws', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      if (this.currentRoom) {
        this.socket?.emit('join', { recipeId: this.currentRoom, userId: this.getUserId() });
      }
    });

    this.socket.on('disconnect', () => {});

    this.socket.on('op_broadcast', (data: { op: OpLog; fromUserId: string }) => {
      this.emit('op', data.op, data.fromUserId);
    });

    this.socket.on('cursor_update', (data: { userId: string; position: CursorPos }) => {
      this.emit('cursor', data.userId, data.position);
    });

    this.socket.on('user_join', (data: { user: Collaborator }) => {
      this.emit('user_join', data.user);
    });

    this.socket.on('user_leave', (data: { userId: string }) => {
      this.emit('user_leave', data.userId);
    });

    this.socket.on('conflict', (data: { localOp: OpLog; remoteOp: OpLog }) => {
      this.emit('conflict', data.localOp, data.remoteOp);
    });

    this.socket.on('version_snapshot', (data: { snapshot: VersionSnapshot }) => {
      this.emit('version', data.snapshot);
    });
  }

  disconnect(): void {
    if (this.currentRoom) {
      this.leaveRoom(this.currentRoom);
    }
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  joinRoom(recipeId: string): void {
    this.currentRoom = recipeId;
    this.socket?.emit('join', { recipeId, userId: this.getUserId() });
  }

  leaveRoom(recipeId: string): void {
    this.socket?.emit('leave', { recipeId });
    this.currentRoom = null;
  }

  sendOp(recipeId: string, op: OpLog): void {
    this.socket?.emit('op', { recipeId, op });
  }

  sendCursor(recipeId: string, position: CursorPos): void {
    this.socket?.emit('cursor', { recipeId, position });
  }

  resolveConflict(recipeId: string, resolution: 'accept_ours' | 'accept_theirs' | 'merge'): void {
    this.socket?.emit('conflict_resolve', { recipeId, resolution });
  }

  onOp(handler: OpHandler): () => void {
    return this.addListener('op', handler);
  }

  onCursor(handler: CursorHandler): () => void {
    return this.addListener('cursor', handler);
  }

  onUserJoin(handler: UserHandler): () => void {
    return this.addListener('user_join', handler);
  }

  onUserLeave(handler: (userId: string) => void): () => void {
    return this.addListener('user_leave', handler);
  }

  onConflict(handler: ConflictHandler): () => void {
    return this.addListener('conflict', handler);
  }

  onVersion(handler: VersionHandler): () => void {
    return this.addListener('version', handler);
  }

  private addListener(event: string, handler: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((handler) => handler(...args));
  }

  private getUserId(): string {
    return localStorage.getItem('userId') || 'anonymous';
  }
}

const socketService = new SocketService();
export default socketService;
export type { OpLog, CursorPos };
