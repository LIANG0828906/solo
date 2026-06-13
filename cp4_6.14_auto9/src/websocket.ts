import type { WSMessage, WSMessageType } from './types';

type MessageHandler = (message: WSMessage) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<WSMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string = '';
  private clientId: string = '';
  private isManualClose = false;
  private messageQueue: WSMessage[] = [];
  private onConnectHandler: (() => void) | null = null;

  constructor() {
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  getClientId(): string {
    return this.clientId;
  }

  connect(url: string): void {
    this.url = url;
    this.isManualClose = false;
    this.establishConnection();
  }

  private establishConnection(): void {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = this.url.startsWith('ws') ? this.url : `${protocol}//${this.url}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.flushQueue();
        this.onConnectHandler?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.dispatch(message);
        } catch (e) {
          console.error('[WebSocket] Parse error:', e);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        if (!this.isManualClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    } catch (e) {
      console.error('[WebSocket] Connection failed:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached');
      return;
    }
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.establishConnection(), delay);
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const msg = this.messageQueue.shift()!;
      this.sendRaw(msg);
    }
  }

  private sendRaw(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  send(type: WSMessageType, payload: any): void {
    const message: WSMessage = {
      type,
      payload,
      senderId: this.clientId,
      timestamp: Date.now()
    };

    if (this.isConnected()) {
      this.sendRaw(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  on(type: WSMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  onConnect(handler: () => void): void {
    this.onConnectHandler = handler;
  }

  off(type: WSMessageType, handler: MessageHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  private dispatch(message: WSMessage): void {
    if (message.senderId === this.clientId) {
      return;
    }
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(message);
        } catch (e) {
          console.error('[WebSocket] Handler error:', e);
        }
      });
    }
  }

  close(): void {
    this.isManualClose = true;
    this.ws?.close();
  }

  broadcastLocalMessage(type: WSMessageType, payload: any): void {
    const message: WSMessage = {
      type,
      payload,
      senderId: 'local',
      timestamp: Date.now()
    };
    this.dispatchForLocal(message);
  }

  private dispatchForLocal(message: WSMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(message);
        } catch (e) {
          console.error('[WebSocket] Local handler error:', e);
        }
      });
    }
  }
}

export const wsManager = new WebSocketManager();

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return '刚刚';
  }
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  const days = Math.floor(diff / 86400000);
  if (days < 30) {
    return `${days}天前`;
  }
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
