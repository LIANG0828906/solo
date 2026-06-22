import type { NoteEvent, InstrumentType } from './instrument';
import { io, Socket } from 'socket.io-client';

export interface User {
  id: string;
  name: string;
  color: string;
  instrument: InstrumentType;
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  '#FF7F50', '#87CEEB', '#DEB887', '#20B2AA'
];

export class SessionManager {
  private socket: Socket | null = null;
  private roomId: string = '';
  private userId: string = '';
  private userName: string = '';
  private userColor: string = '#00BFFF';
  private currentInstrument: InstrumentType = 'piano';
  private users: Map<string, User> = new Map();
  private serverTimeOffset: number = 0;
  private lastPingTimes: number[] = [];
  private onUsersChangeCallback?: (users: User[]) => void;
  private onRemoteNoteCallback?: (event: NoteEvent & { userId: string; color: string }) => void;
  private onRoomJoinedCallback?: (roomId: string) => void;
  private onConnectionStatusCallback?: (connected: boolean) => void;
  private bpm: number = 120;
  private beatStartTime: number = 0;

  constructor() {
    this.userId = 'user_' + Math.random().toString(36).substring(2, 10);
    this.userName = '用户' + Math.floor(Math.random() * 10000);
    this.userColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  }

  getUserId(): string {
    return this.userId;
  }

  getUserName(): string {
    return this.userName;
  }

  getUserColor(): string {
    return this.userColor;
  }

  getRoomId(): string {
    return this.roomId;
  }

  getUsers(): User[] {
    const result: User[] = [];
    this.users.forEach((user) => result.push(user));
    return result;
  }

  setInstrument(instrument: InstrumentType): void {
    this.currentInstrument = instrument;
    if (this.socket && this.socket.connected) {
      this.socket.emit('user:instrument', {
        userId: this.userId,
        instrument
      });
    }
  }

  setOnUsersChange(callback: (users: User[]) => void): void {
    this.onUsersChangeCallback = callback;
  }

  setOnRemoteNote(callback: (event: NoteEvent & { userId: string; color: string }) => void): void {
    this.onRemoteNoteCallback = callback;
  }

  setOnRoomJoined(callback: (roomId: string) => void): void {
    this.onRoomJoinedCallback = callback;
  }

  setOnConnectionStatus(callback: (connected: boolean) => void): void {
    this.onConnectionStatusCallback = callback;
  }

  connect(): void {
    try {
      this.socket = io({
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        if (this.onConnectionStatusCallback) {
          this.onConnectionStatusCallback(true);
        }
        this.startTimeSync();
      });

      this.socket.on('disconnect', () => {
        if (this.onConnectionStatusCallback) {
          this.onConnectionStatusCallback(false);
        }
      });

      this.socket.on('room:users', (data: { users: User[] }) => {
        this.users.clear();
        data.users.forEach(user => {
          this.users.set(user.id, user);
        });
        if (this.onUsersChangeCallback) {
          this.onUsersChangeCallback(this.getUsers());
        }
      });

      this.socket.on('room:userJoined', (user: User) => {
        this.users.set(user.id, user);
        if (this.onUsersChangeCallback) {
          this.onUsersChangeCallback(this.getUsers());
        }
      });

      this.socket.on('room:userLeft', (data: { userId: string }) => {
        this.users.delete(data.userId);
        if (this.onUsersChangeCallback) {
          this.onUsersChangeCallback(this.getUsers());
        }
      });

      this.socket.on('note:play', (data: NoteEvent & { userId: string; color: string }) => {
        this.handleRemoteNote(data);
      });

      this.socket.on('sync:time', (data: { serverTime: number; clientSendTime: number }) => {
        const now = performance.now();
        const rtt = now - data.clientSendTime;
        const oneWay = rtt / 2;
        const estimatedServerTime = data.serverTime + oneWay;
        this.serverTimeOffset = estimatedServerTime - now;

        this.lastPingTimes.push(rtt);
        if (this.lastPingTimes.length > 10) {
          this.lastPingTimes.shift();
        }
      });

      this.socket.on('room:bpm', (data: { bpm: number; startTime: number }) => {
        this.bpm = data.bpm;
        this.beatStartTime = data.startTime;
      });

    } catch (e) {
      console.warn('WebSocket连接失败，使用离线模式', e);
      this.addLocalUser();
    }
  }

  private startTimeSync(): void {
    const syncInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('sync:ping', {
          clientSendTime: performance.now()
        });
      }
    }, 5000);

    if (this.socket) {
      this.socket.emit('sync:ping', {
        clientSendTime: performance.now()
      });
    }

    setTimeout(() => clearInterval(syncInterval), 60000);
  }

  private addLocalUser(): void {
    this.users.set(this.userId, {
      id: this.userId,
      name: this.userName,
      color: this.userColor,
      instrument: this.currentInstrument
    });
    if (this.onUsersChangeCallback) {
      this.onUsersChangeCallback(this.getUsers());
    }
  }

  createRoom(roomId?: string): string {
    const id = roomId || Math.random().toString(36).substring(2, 8).toUpperCase();
    this.roomId = id;

    if (this.socket && this.socket.connected) {
      this.socket.emit('room:create', {
        roomId: id,
        user: {
          id: this.userId,
          name: this.userName,
          color: this.userColor,
          instrument: this.currentInstrument
        }
      });
    } else {
      this.addLocalUser();
    }

    if (this.onRoomJoinedCallback) {
      this.onRoomJoinedCallback(id);
    }

    return id;
  }

  joinRoom(roomId: string): boolean {
    if (!roomId || roomId.trim().length === 0) {
      return false;
    }

    this.roomId = roomId.trim().toUpperCase();

    if (this.socket && this.socket.connected) {
      this.socket.emit('room:join', {
        roomId: this.roomId,
        user: {
          id: this.userId,
          name: this.userName,
          color: this.userColor,
          instrument: this.currentInstrument
        }
      });
    } else {
      this.addLocalUser();
    }

    if (this.onRoomJoinedCallback) {
      this.onRoomJoinedCallback(this.roomId);
    }

    return true;
  }

  leaveRoom(): void {
    if (this.socket && this.socket.connected && this.roomId) {
      this.socket.emit('room:leave', {
        roomId: this.roomId,
        userId: this.userId
      });
    }
    this.roomId = '';
    this.users.clear();
    if (this.onUsersChangeCallback) {
      this.onUsersChangeCallback([]);
    }
  }

  sendNote(event: NoteEvent): void {
    if (this.socket && this.socket.connected && this.roomId) {
      const syncedTimestamp = event.timestamp + this.serverTimeOffset;
      this.socket.emit('note:send', {
        ...event,
        timestamp: syncedTimestamp,
        userId: this.userId,
        color: this.userColor,
        instrument: this.currentInstrument
      });
    }
  }

  sendBPM(bpm: number): void {
    this.bpm = bpm;
    this.beatStartTime = performance.now() + this.serverTimeOffset;
    if (this.socket && this.socket.connected && this.roomId) {
      this.socket.emit('room:setBPM', {
        roomId: this.roomId,
        bpm,
        startTime: this.beatStartTime
      });
    }
  }

  private handleRemoteNote(event: NoteEvent & { userId: string; color: string }): void {
    if (event.userId === this.userId) return;

    const localTimestamp = event.timestamp - this.serverTimeOffset;
    const now = performance.now();
    const delay = Math.max(0, Math.min(100, localTimestamp - now + 30));

    setTimeout(() => {
      if (this.onRemoteNoteCallback) {
        this.onRemoteNoteCallback(event);
      }
    }, delay);
  }

  getAverageLatency(): number {
    if (this.lastPingTimes.length === 0) return 0;
    const sum = this.lastPingTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.lastPingTimes.length);
  }

  getJitter(): number {
    if (this.lastPingTimes.length < 2) return 0;
    const avg = this.lastPingTimes.reduce((a, b) => a + b, 0) / this.lastPingTimes.length;
    const variance = this.lastPingTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / this.lastPingTimes.length;
    return Math.round(Math.sqrt(variance));
  }

  getBPM(): number {
    return this.bpm;
  }

  static getAvailableColors(): string[] {
    return [...USER_COLORS];
  }
}
