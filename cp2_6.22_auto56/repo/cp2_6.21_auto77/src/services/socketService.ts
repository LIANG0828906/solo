import type { SocketEventType, SocketMessage } from '../types';

type EventCallback = (data: any) => void;

const WS_BASE = 'ws://localhost:8000/ws';
const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;

class SocketService {
  private static instance: SocketService | null = null;
  private socket: WebSocket | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private eventListeners: Map<SocketEventType | string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private isManualDisconnect = false;
  private connectPromise: Promise<void> | null = null;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((error: any) => void) | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(roomId: string, userId: string, userName: string): Promise<void> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;

    this.connectPromise = new Promise((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this._connect();
    });

    return this.connectPromise;
  }

  private _connect(): void {
    if (!this.roomId) {
      this.connectReject?.(new Error('Room ID not set'));
      this._resetConnectState();
      return;
    }

    try {
      this.socket = new WebSocket(`${WS_BASE}/${this.roomId}`);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.send('joinRoom', {
          userId: this.userId,
          userName: this.userName,
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (e) {
          console.error('[SocketService] Failed to parse message:', e);
        }
      };

      this.socket.onerror = (error) => {
        console.error('[SocketService] WebSocket error:', error);
      };

      this.socket.onclose = (event) => {
        console.log('[SocketService] WebSocket closed:', event.code, event.reason);
        if (!this.isManualDisconnect) {
          this._tryReconnect();
        }
      };
    } catch (error) {
      console.error('[SocketService] Failed to create WebSocket:', error);
      this.connectReject?.(error);
      this._resetConnectState();
    }
  }

  private _handleMessage(message: SocketMessage): void {
    if (message.type === 'roomState' && this.connectResolve) {
      this.connectResolve();
      this._resetConnectState();
    }

    const callbacks = this.eventListeners.get(message.type);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(message);
        } catch (e) {
          console.error(`[SocketService] Error in event listener for ${message.type}:`, e);
        }
      });
    }
  }

  private _tryReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[SocketService] Max reconnection attempts reached');
      if (this.connectReject) {
        this.connectReject(new Error('Failed to reconnect after maximum attempts'));
        this._resetConnectState();
      }
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[SocketService] Reconnecting... Attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
    );

    setTimeout(() => {
      if (!this.isManualDisconnect) {
        this._connect();
      }
    }, RECONNECT_DELAY);
  }

  private _resetConnectState(): void {
    this.connectPromise = null;
    this.connectResolve = null;
    this.connectReject = null;
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    this.roomId = null;
    this.userId = null;
    this.userName = null;
    this._resetConnectState();
    this.eventListeners.clear();
  }

  send(type: string, data: any = {}): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[SocketService] WebSocket is not connected');
      return;
    }

    const message = { type, ...data };
    try {
      this.socket.send(JSON.stringify(message));
    } catch (e) {
      console.error('[SocketService] Failed to send message:', e);
    }
  }

  on(event: SocketEventType | string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.off(event, callback);
    };
  }

  off(event: SocketEventType | string, callback: EventCallback): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getUserId(): string | null {
    return this.userId;
  }
}

export const socketService = SocketService.getInstance();
export default socketService;
