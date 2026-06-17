import type { CollabMessage, Pixel } from '../pixelBoard/types';
import { SyncManager } from './sync';
import { usePixelStore } from '../pixelBoard/store';

const CHANNEL_NAME = 'pixel-palette-collab';
const HEARTBEAT_INTERVAL = 3000;
const USER_TIMEOUT = 8000;

export class CollaborationChannel {
  private channel: BroadcastChannel | null = null;
  private syncManager: SyncManager | null = null;
  private userId: string = '';
  private isConnected: boolean = false;
  private activeUsers: Map<string, number> = new Map();
  private heartbeatInterval: number | null = null;
  private onRemotePixelAdded: ((pixel: Pixel) => void) | null = null;

  connect(): void {
    if (this.isConnected) return;

    this.userId = usePixelStore.getState().userId;
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.syncManager = new SyncManager(this.userId);

    this.syncManager.setOnPixelAdded((pixel, isRemote) => {
      if (isRemote && this.onRemotePixelAdded) {
        this.onRemotePixelAdded(pixel);
      }
    });

    this.channel.onmessage = (event: MessageEvent<CollabMessage>) => {
      this.handleMessage(event.data);
    };

    this.activeUsers.set(this.userId, Date.now());

    this.broadcastUserJoin();
    this.broadcastSyncRequest();
    this.startHeartbeat();

    this.isConnected = true;
    usePixelStore.getState().setConnected(true);
    this.updateOnlineUsers();
  }

  disconnect(): void {
    if (!this.isConnected || !this.channel) return;

    this.broadcastUserLeave();
    this.stopHeartbeat();

    this.channel.close();
    this.channel = null;
    this.syncManager = null;
    this.isConnected = false;
    this.activeUsers.clear();

    usePixelStore.getState().setConnected(false);
    usePixelStore.getState().setOnlineUsers(1);
  }

  setOnRemotePixelAdded(callback: (pixel: Pixel) => void): void {
    this.onRemotePixelAdded = callback;
  }

  private handleMessage(message: CollabMessage): void {
    if (!message.senderId || message.senderId === this.userId) return;

    if (message.type !== 'HEARTBEAT') {
      this.activeUsers.set(message.senderId, Date.now());
      this.updateOnlineUsers();
    }

    switch (message.type) {
      case 'USER_JOIN':
        this.activeUsers.set(message.senderId, Date.now());
        this.updateOnlineUsers();
        this.broadcastSyncResponse();
        break;

      case 'USER_LEAVE':
        this.activeUsers.delete(message.senderId);
        this.updateOnlineUsers();
        break;

      case 'HEARTBEAT':
        this.activeUsers.set(message.senderId, Date.now());
        this.updateOnlineUsers();
        break;

      default:
        if (this.syncManager) {
          this.syncManager.handleMessage(message);
        }
        break;
    }
  }

  private updateOnlineUsers(): void {
    const now = Date.now();
    for (const [userId, lastSeen] of this.activeUsers) {
      if (now - lastSeen > USER_TIMEOUT && userId !== this.userId) {
        this.activeUsers.delete(userId);
      }
    }
    usePixelStore.getState().setOnlineUsers(this.activeUsers.size);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      this.broadcastHeartbeat();
      this.updateOnlineUsers();
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendPixel(pixel: Pixel): void {
    if (!this.channel || !this.syncManager) return;

    const message = this.syncManager.broadcastPixel(pixel);
    this.channel.postMessage(message);
  }

  sendUndo(pixelId: string): void {
    if (!this.channel || !this.syncManager) return;

    const message = this.syncManager.broadcastUndo(pixelId);
    this.channel.postMessage(message);
  }

  private broadcastSyncRequest(): void {
    if (!this.channel || !this.syncManager) return;

    const message = this.syncManager.broadcastSyncRequest();
    this.channel.postMessage(message);
  }

  private broadcastSyncResponse(): void {
    if (!this.channel || !this.syncManager) return;

    const pixels = usePixelStore.getState().pixels;
    const message = this.syncManager.broadcastSyncResponse(pixels, '');
    this.channel.postMessage(message);
  }

  private broadcastUserJoin(): void {
    if (!this.channel || !this.syncManager) return;

    const message = this.syncManager.broadcastUserJoin();
    this.channel.postMessage(message);
  }

  private broadcastUserLeave(): void {
    if (!this.channel || !this.syncManager) return;

    const message = this.syncManager.broadcastUserLeave();
    this.channel.postMessage(message);
  }

  private broadcastHeartbeat(): void {
    if (!this.channel) return;

    const message: CollabMessage = {
      type: 'HEARTBEAT',
      senderId: this.userId,
      timestamp: Date.now(),
    };
    this.channel.postMessage(message);
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getUserId(): string {
    return this.userId;
  }
}

export const collaborationChannel = new CollaborationChannel();

export function connectCollaboration(): void {
  collaborationChannel.connect();
}

export function disconnectCollaboration(): void {
  collaborationChannel.disconnect();
}
