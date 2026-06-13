import { io, Socket } from 'socket.io-client';
import { gameEngine } from './gameEngine';

interface SyncModuleEvents {
  connected: () => void;
  disconnected: () => void;
  'room:created': (data: { roomId: string; playerId: string }) => void;
  'room:joined': (data: { roomId: string; playerId: string; opponentId: string }) => void;
  'player:joined': (data: { playerId: string }) => void;
  'game:start': () => void;
  'error': (data: { message: string }) => void;
}

type EventCallback = (...args: unknown[]) => void;

class PlayerSync {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private playerId: string | null = null;
  private roomId: string | null = null;
  private connected: boolean = false;
  private eventQueue: { event: string; data: unknown }[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    gameEngine.setSyncCallback((event, data) => {
      this.handleGameEvent(event, data);
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io({
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          this.connected = true;
          this.playerId = this.socket?.id || null;
          this.emit('connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          this.emit('disconnected');
        });

        this.socket.on('connect_error', (err) => {
          reject(err);
        });

        this.socket.on('room:created', (data: { roomId: string; playerId: string }) => {
          this.roomId = data.roomId;
          this.playerId = data.playerId;
          gameEngine.setRoomId(data.roomId);
          this.emit('room:created', data);
        });

        this.socket.on('room:joined', (data: { roomId: string; playerId: string; opponentId: string }) => {
          this.roomId = data.roomId;
          this.playerId = data.playerId;
          gameEngine.setRoomId(data.roomId);
          this.emit('room:joined', data);
        });

        this.socket.on('player:joined', (data: { playerId: string }) => {
          this.emit('player:joined', data);
        });

        this.socket.on('game:start', () => {
          gameEngine.startGame();
          this.emit('game:start');
        });

        this.socket.on('game:event', (data: { event: string; data: Record<string, unknown>; fromPlayerId: string }) => {
          if (data.fromPlayerId !== this.playerId) {
            setTimeout(() => {
              gameEngine.applyOpponentAction(data.event, data.data);
            }, 200);
          }
        });

        this.socket.on('error', (data: { message: string }) => {
          this.emit('error', data);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleGameEvent(event: string, data: unknown): void {
    if (!this.connected || !this.socket) return;

    this.eventQueue.push({ event, data });

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flushQueue(), 16);
    }
  }

  private flushQueue(): void {
    if (!this.socket || this.eventQueue.length === 0) {
      this.flushTimer = null;
      return;
    }

    for (const item of this.eventQueue) {
      this.socket.emit('game:event', {
        event: item.event,
        data: item.data,
        roomId: this.roomId,
        playerId: this.playerId
      });
    }

    this.eventQueue = [];
    this.flushTimer = null;
  }

  createRoom(): void {
    if (!this.socket) return;
    this.socket.emit('room:create');
  }

  joinRoom(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('room:join', { roomId });
  }

  startGame(): void {
    if (!this.socket) return;
    this.socket.emit('game:start', { roomId: this.roomId });
  }

  playerReady(isReady: boolean): void {
    if (!this.socket) return;
    gameEngine.playerReady(this.playerId || 'local-player', isReady);
    this.socket.emit('player:ready', { roomId: this.roomId, isReady });
  }

  on<K extends keyof SyncModuleEvents>(event: K, callback: SyncModuleEvents[K]): void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(callback as EventCallback);
  }

  off<K extends keyof SyncModuleEvents>(event: K, callback: SyncModuleEvents[K]): void {
    this.listeners.get(event as string)?.delete(callback as EventCallback);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  disconnect(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.eventQueue = [];
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
  }
}

export const playerSync = new PlayerSync();
export default playerSync;
