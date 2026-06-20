import { io, Socket } from 'socket.io-client';
import { gameEngine } from './gameEngine';

interface DelayedEvent {
  event: string;
  data: Record<string, unknown>;
  fromPlayerId: string;
  scheduledAt: number;
}

class DelayQueue {
  private queue: DelayedEvent[] = [];
  private processing: boolean = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly DELAY_MS = 200;
  private handler: (event: string, data: Record<string, unknown>) => void;

  constructor(handler: (event: string, data: Record<string, unknown>) => void) {
    this.handler = handler;
  }

  enqueue(event: string, data: Record<string, unknown>, fromPlayerId: string): void {
    const scheduledAt = Date.now() + this.DELAY_MS;
    this.queue.push({ event, data, fromPlayerId, scheduledAt });
    this.queue.sort((a, b) => a.scheduledAt - b.scheduledAt);

    if (!this.processing) {
      this.processNext();
    }
  }

  private processNext(): void {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const next = this.queue[0];
    const now = Date.now();
    const waitTime = Math.max(0, next.scheduledAt - now);

    this.timer = setTimeout(() => {
      const item = this.queue.shift();
      if (item) {
        this.handler(item.event, item.data);
      }
      this.processNext();
    }, waitTime);
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue = [];
    this.processing = false;
  }
}

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
  private sendQueue: { event: string; data: unknown }[] = [];
  private sendFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private delayQueue: DelayQueue;

  constructor() {
    this.delayQueue = new DelayQueue((event, data) => {
      gameEngine.applyOpponentAction(event, data);
    });

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
            this.delayQueue.enqueue(data.event, data.data, data.fromPlayerId);
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

    this.sendQueue.push({ event, data });

    if (!this.sendFlushTimer) {
      this.sendFlushTimer = setTimeout(() => this.flushSendQueue(), 16);
    }
  }

  private flushSendQueue(): void {
    if (!this.socket || this.sendQueue.length === 0) {
      this.sendFlushTimer = null;
      return;
    }

    for (const item of this.sendQueue) {
      this.socket.emit('game:event', {
        event: item.event,
        data: item.data,
        roomId: this.roomId,
        playerId: this.playerId
      });
    }

    this.sendQueue = [];
    this.sendFlushTimer = null;
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
    if (this.sendFlushTimer) {
      clearTimeout(this.sendFlushTimer);
      this.sendFlushTimer = null;
    }
    this.sendQueue = [];
    this.delayQueue.clear();
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
  }
}

export const playerSync = new PlayerSync();
export default playerSync;
