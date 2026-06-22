import { v4 as uuidv4 } from 'uuid';
import type { UserState, SyncEvent, SyncEventType } from '../sync-worker/types';

const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#3b82f6',
  '#0ea5e9',
  '#14b8a6',
  '#10b981',
  '#84cc16',
  '#f59e0b',
];

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export interface RoomMember extends UserState {
  isLeaving?: boolean;
}

export interface RoomStateType {
  roomId: string | null;
  members: RoomMember[];
  localUserId: string | null;
  isConnected: boolean;
}

type EventCallback = (event: SyncEvent) => void;

export class RoomManager {
  private state: RoomStateType = {
    roomId: null,
    members: [],
    localUserId: null,
    isConnected: false,
  };

  private worker: SharedWorker | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<EventCallback> = new Set();
  private stateListeners: Set<(state: RoomStateType) => void> = new Set();

  constructor() {
    this.localUserId = uuidv4();
  }

  get localUserId(): string {
    return this.state.localUserId || '';
  }

  private set localUserId(id: string) {
    this.state.localUserId = id;
  }

  getState(): RoomStateType {
    return { ...this.state, members: [...this.state.members] };
  }

  subscribe(callback: (state: RoomStateType) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  subscribeToEvents(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyState(): void {
    const state = this.getState();
    this.stateListeners.forEach((cb) => cb(state));
  }

  private notifyEvent(event: SyncEvent): void {
    this.listeners.forEach((cb) => cb(event));
  }

  async createRoom(userName: string): Promise<string> {
    if (this.state.roomId) {
      throw new Error('已经在房间中');
    }

    const userId = this.state.localUserId!;
    const avatarColor = getRandomColor();

    this.worker = new SharedWorker(
      new URL('../sync-worker/shared-worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.port.onmessage = (e: MessageEvent) => {
      this.handleWorkerMessage(e.data);
    };

    this.worker.port.start();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('创建房间超时'));
      }, 5000);

      const handleCreate = (data: any) => {
        if (data.type === 'room-created') {
          clearTimeout(timeout);
          this.state.roomId = data.roomId;
          this.state.isConnected = true;
          
          const user: UserState = {
            userId,
            userName,
            avatarColor,
            muted: false,
            volume: 80,
            isSpeaking: false,
            lastActive: Date.now(),
          };
          
          this.worker!.port.postMessage({
            action: 'join-room',
            data: {
              roomId: data.roomId,
              user,
            },
          });

          this.state.members = [user];
          this.setupBroadcastChannel(data.roomId);
          this.notifyState();
          resolve(data.roomId);
        }
      };

      this.worker!.port.addEventListener('message', (e: MessageEvent) => {
        handleCreate(e.data);
      });

      this.worker!.port.postMessage({ action: 'create-room' });
    });
  }

  async joinRoom(roomId: string, userName: string): Promise<void> {
    if (this.state.roomId) {
      throw new Error('已经在房间中');
    }

    const userId = this.state.localUserId!;
    const avatarColor = getRandomColor();

    this.worker = new SharedWorker(
      new URL('../sync-worker/shared-worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.port.onmessage = (e: MessageEvent) => {
      this.handleWorkerMessage(e.data);
    };

    this.worker.port.start();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('加入房间超时'));
      }, 5000);

      const handleJoin = (data: any) => {
        if (data.type === 'room-joined') {
          clearTimeout(timeout);
          this.state.roomId = roomId;
          this.state.isConnected = true;
          this.setupBroadcastChannel(roomId);
          
          this.worker!.port.postMessage({
            action: 'get-room-info',
            data: { roomId, userId },
          });
          
          resolve();
        } else if (data.type === 'join-failed') {
          clearTimeout(timeout);
          reject(new Error(data.reason || '加入房间失败'));
        }
      };

      this.worker!.port.addEventListener('message', (e: MessageEvent) => {
        handleJoin(e.data);
      });

      const user: UserState = {
        userId,
        userName,
        avatarColor,
        muted: false,
        volume: 80,
        isSpeaking: false,
        lastActive: Date.now(),
      };

      this.worker!.port.postMessage({
        action: 'join-room',
        data: {
          roomId,
          user,
        },
      });
    });
  }

  private setupBroadcastChannel(roomId: string): void {
    this.broadcastChannel = new BroadcastChannel(`music-room-${roomId}`);
    this.broadcastChannel.onmessage = (e) => {
      if (e.data.type && e.data.type !== 'ping' && e.data.type !== 'pong') {
        this.handleSyncEvent(e.data);
      }
    };
  }

  private handleWorkerMessage(data: any): void {
    if (data.type === 'room-info') {
      const payload = data.payload;
      this.state.members = payload.users.map((u: any) => ({
        ...u,
        lastActive: Date.now(),
      }));
      this.notifyState();
    } else if (data.type && typeof data.type === 'string') {
      this.handleSyncEvent(data);
    }
  }

  private handleSyncEvent(event: SyncEvent): void {
    this.notifyEvent(event);

    switch (event.type) {
      case 'user-join': {
        const payload = event.payload as any;
        const existing = this.state.members.find((m) => m.userId === payload.userId);
        if (!existing) {
          this.state.members.push({
            userId: payload.userId,
            userName: payload.userName,
            avatarColor: payload.avatarColor,
            muted: false,
            volume: 80,
            isSpeaking: false,
            lastActive: Date.now(),
          });
          this.notifyState();
        }
        break;
      }
      case 'user-leave': {
        const payload = event.payload as any;
        const member = this.state.members.find((m) => m.userId === payload.userId);
        if (member && member.userId !== this.state.localUserId) {
          member.isLeaving = true;
          this.notifyState();
          
          setTimeout(() => {
            this.state.members = this.state.members.filter(
              (m) => m.userId !== payload.userId
            );
            this.notifyState();
          }, 200);
        }
        break;
      }
      case 'user-mute': {
        const payload = event.payload as any;
        const member = this.state.members.find((m) => m.userId === payload.userId);
        if (member) {
          member.muted = payload.muted;
          this.notifyState();
        }
        break;
      }
      case 'user-volume': {
        const payload = event.payload as any;
        const member = this.state.members.find((m) => m.userId === payload.userId);
        if (member) {
          member.volume = payload.volume;
          this.notifyState();
        }
        break;
      }
      case 'user-name': {
        const payload = event.payload as any;
        const member = this.state.members.find((m) => m.userId === payload.userId);
        if (member) {
          member.userName = payload.userName;
          this.notifyState();
        }
        break;
      }
    }
  }

  sendSyncEvent<T extends SyncEventType>(type: T, payload: any): void {
    if (!this.worker || !this.state.roomId) return;

    const event: SyncEvent<T> = {
      type,
      userId: this.state.localUserId!,
      timestamp: Date.now(),
      payload: {
        ...payload,
        roomId: this.state.roomId,
      },
    };

    this.worker.port.postMessage({
      action: 'sync-event',
      data: event,
    });

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(event);
    }
  }

  updateMuted(muted: boolean): void {
    const member = this.state.members.find((m) => m.userId === this.state.localUserId);
    if (member) {
      member.muted = muted;
      this.notifyState();
    }
    this.sendSyncEvent('user-mute', {
      userId: this.state.localUserId,
      muted,
    });
  }

  updateVolume(volume: number): void {
    const member = this.state.members.find((m) => m.userId === this.state.localUserId);
    if (member) {
      member.volume = volume;
      this.notifyState();
    }
    this.sendSyncEvent('user-volume', {
      userId: this.state.localUserId,
      volume,
    });
  }

  updateName(userName: string): void {
    const member = this.state.members.find((m) => m.userId === this.state.localUserId);
    if (member) {
      member.userName = userName;
      this.notifyState();
    }
    this.sendSyncEvent('user-name', {
      userId: this.state.localUserId,
      userName,
    });
  }

  updateSpeaking(isSpeaking: boolean): void {
    const member = this.state.members.find((m) => m.userId === this.state.localUserId);
    if (member) {
      member.isSpeaking = isSpeaking;
      member.lastActive = Date.now();
    }
  }

  leaveRoom(): void {
    if (!this.state.roomId) return;

    this.sendSyncEvent('user-leave', {
      userId: this.state.localUserId,
    });

    if (this.worker) {
      this.worker.port.postMessage({ action: 'leave-room' });
      this.worker.port.close();
      this.worker = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.state.roomId = null;
    this.state.members = [];
    this.state.isConnected = false;
    this.notifyState();
  }

  getLocalMember(): RoomMember | undefined {
    return this.state.members.find((m) => m.userId === this.state.localUserId);
  }

  getMemberColor(userId: string): string {
    const member = this.state.members.find((m) => m.userId === userId);
    return member?.avatarColor || '#6366f1';
  }
}
