import type { AppState, Action } from '@/types';

const CHANNEL_NAME = 'sketchsync-channel';
const STORAGE_KEY = 'sketchsync-state';
const HEARTBEAT_INTERVAL = 2000;
const HEARTBEAT_TIMEOUT = 3000;

type SyncMessage =
  | { type: 'STATE_UPDATE'; payload: Partial<AppState>; senderId: string }
  | { type: 'ACTION_DISPATCH'; payload: Action; senderId: string }
  | { type: 'HEARTBEAT'; senderId: string; timestamp: number }
  | { type: 'REQUEST_FULL_STATE'; senderId: string }
  | { type: 'FULL_STATE_RESPONSE'; payload: AppState; senderId: string };

export class BroadcastSync {
  private channel: BroadcastChannel;
  private clientId: string;
  private heartbeatTimer: number | null = null;
  private connectedClients: Map<string, number> = new Map();
  private onStateSync: ((state: Partial<AppState>) => void) | null = null;
  private onActionDispatch: ((action: Action) => void) | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private connectionCheckTimer: number | null = null;

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.clientId = this.generateClientId();
    this.setupMessageHandler();
    this.startHeartbeat();
    this.startConnectionCheck();
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupMessageHandler(): void {
    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;
      if (!message || message.senderId === this.clientId) return;

      switch (message.type) {
        case 'STATE_UPDATE':
          this.onStateSync?.(message.payload);
          break;
        case 'ACTION_DISPATCH':
          this.onActionDispatch?.(message.payload);
          break;
        case 'HEARTBEAT':
          this.connectedClients.set(message.senderId, message.timestamp);
          break;
        case 'REQUEST_FULL_STATE':
          this.sendFullStateResponse();
          break;
        case 'FULL_STATE_RESPONSE':
          this.onStateSync?.(message.payload);
          break;
      }
    };
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      this.channel.postMessage({
        type: 'HEARTBEAT',
        senderId: this.clientId,
        timestamp: Date.now(),
      } as SyncMessage);
    }, HEARTBEAT_INTERVAL);

    this.requestFullState();
  }

  private startConnectionCheck(): void {
    this.connectionCheckTimer = window.setInterval(() => {
      const now = Date.now();
      let hasActiveConnection = false;

      for (const [, timestamp] of this.connectedClients) {
        if (now - timestamp < HEARTBEAT_TIMEOUT) {
          hasActiveConnection = true;
          break;
        }
      }

      this.connectedClients.forEach((timestamp, clientId) => {
        if (now - timestamp >= HEARTBEAT_TIMEOUT) {
          this.connectedClients.delete(clientId);
        }
      });

      this.onConnectionChange?.(hasActiveConnection);
    }, 1000);
  }

  private requestFullState(): void {
    this.channel.postMessage({
      type: 'REQUEST_FULL_STATE',
      senderId: this.clientId,
    } as SyncMessage);
  }

  private sendFullStateResponse(): void {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        this.channel.postMessage({
          type: 'FULL_STATE_RESPONSE',
          payload: state,
          senderId: this.clientId,
        } as SyncMessage);
      } catch {
        // Ignore parse errors
      }
    }
  }

  broadcastState(state: Partial<AppState>): void {
    this.channel.postMessage({
      type: 'STATE_UPDATE',
      payload: state,
      senderId: this.clientId,
    } as SyncMessage);

    this.saveToStorage(state);
  }

  broadcastAction(action: Action): void {
    this.channel.postMessage({
      type: 'ACTION_DISPATCH',
      payload: action,
      senderId: this.clientId,
    } as SyncMessage);
  }

  saveToStorage(state: Partial<AppState>): void {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const currentState = existing ? JSON.parse(existing) : {};
      const mergedState = { ...currentState, ...state };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedState));
    } catch {
      // Ignore storage errors
    }
  }

  loadFromStorage(): Partial<AppState> | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  setOnStateSync(callback: (state: Partial<AppState>) => void): void {
    this.onStateSync = callback;
  }

  setOnActionDispatch(callback: (action: Action) => void): void {
    this.onActionDispatch = callback;
  }

  setOnConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  getClientId(): string {
    return this.clientId;
  }

  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
      this.connectionCheckTimer = null;
    }
    this.channel.close();
  }
}
