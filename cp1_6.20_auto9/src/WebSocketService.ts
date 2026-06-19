import type { WSMessage, Operation, CursorPosition, ConnectionStatus, User, DocVersion } from './types';

type MessageHandler = (message: WSMessage) => void;

const WS_URL = '/ws';
const RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private status: ConnectionStatus = 'disconnected';
  private handlers: Set<MessageHandler> = new Set();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private clientId: string | null = null;

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${protocol}//${host}${WS_URL}`;
      
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.updateStatus('connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          if (message.type === 'init' && message.clientId) {
            this.clientId = message.clientId;
          }
          this.handlers.forEach(handler => handler(message));
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      this.ws.onerror = () => {
        this.updateStatus('disconnected');
      };

      this.ws.onclose = () => {
        this.updateStatus('disconnected');
        this.scheduleReconnect();
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1), MAX_RECONNECT_DELAY);
    const jitter = delay * 0.3 * Math.random();
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay + jitter);
  }

  private updateStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach(listener => listener(status));
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getClientId(): string | null {
    return this.clientId;
  }

  send(message: WSMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      this.ws.send(JSON.stringify(message));
    } catch (e) {
      console.error('Failed to send WS message:', e);
    }
  }

  sendOperation(operation: Operation): void {
    this.send({ type: 'operation', operation });
  }

  sendCursor(cursor: CursorPosition | null): void {
    this.send({ type: 'cursor', cursor });
  }

  sendRestoreVersion(versionId: string): void {
    this.send({ type: 'restore-version', versionId });
  }

  sendRename(name: string): void {
    this.send({ type: 'rename', name });
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }
}

export const wsService = new WebSocketService();

export type { User, DocVersion, ConnectionStatus, Operation, CursorPosition };
