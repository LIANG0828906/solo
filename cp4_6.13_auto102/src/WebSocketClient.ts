import { ClientMessage, ServerMessage, Shape, Point } from './types';

type MessageHandler = (msg: ServerMessage) => void;

const CURSOR_THROTTLE_MS = 16;
const DEV_BACKEND_URL = 'ws://localhost:8080/ws';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private lastCursorSend = 0;
  private pendingCursor: { position: Point | null; color: string } | null = null;
  private cursorTimer: number | null = null;
  private _lastKnownVersion = 0;
  private _isConnected = false;

  get lastKnownVersion(): number {
    return this._lastKnownVersion;
  }

  set lastKnownVersion(v: number) {
    this._lastKnownVersion = Math.max(this._lastKnownVersion, v);
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  private resolveWsUrl(preferDirect: boolean): string {
    const isDev = import.meta.env?.DEV || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isDev && preferDirect) {
      return DEV_BACKEND_URL;
    }
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}/ws`;
  }

  connect(url?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const tryConnect = (wsUrl: string, fallback: boolean) => {
        try {
          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this._isConnected = true;
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };

          this.ws.onmessage = (event) => {
            try {
              const msg: ServerMessage = JSON.parse(event.data);
              if ('version' in msg) {
                this._lastKnownVersion = Math.max(this._lastKnownVersion, msg.version);
              }
              this.messageHandlers.forEach((handler) => handler(msg));
            } catch (e) {
              console.error('Failed to parse WebSocket message:', e);
            }
          };

          this.ws.onerror = (err) => {
            console.warn(`WebSocket error on ${wsUrl}:`, err);
            if (!fallback && !resolved) {
              console.log('Trying fallback WebSocket URL...');
              tryConnect(this.resolveWsUrl(false), true);
            } else if (resolved) {
              this._isConnected = false;
            } else {
              reject(err);
            }
          };

          this.ws.onclose = () => {
            this._isConnected = false;
            if (resolved) {
              this.scheduleReconnect();
            }
          };
        } catch (e) {
          if (!fallback && !resolved) {
            tryConnect(this.resolveWsUrl(false), true);
          } else {
            reject(e);
          }
        }
      };

      const primaryUrl = url || this.resolveWsUrl(true);
      tryConnect(primaryUrl, false);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 15000);

    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (e) {
        console.error('Failed to send WebSocket message:', e);
      }
    }
  }

  sendDraw(shape: Shape): void {
    this.send({ type: 'draw', shape, lastKnownVersion: this._lastKnownVersion });
  }

  sendUndo(): void {
    this.send({ type: 'undo', lastKnownVersion: this._lastKnownVersion });
  }

  sendRedo(): void {
    this.send({ type: 'redo', lastKnownVersion: this._lastKnownVersion });
  }

  sendCursor(position: Point | null, color: string): void {
    const now = performance.now();

    if (now - this.lastCursorSend >= CURSOR_THROTTLE_MS) {
      this.lastCursorSend = now;
      this.send({ type: 'cursor', position, color });
    } else {
      this.pendingCursor = { position, color };
      if (!this.cursorTimer) {
        this.cursorTimer = window.setTimeout(() => {
          this.cursorTimer = null;
          if (this.pendingCursor) {
            this.lastCursorSend = performance.now();
            this.send({ type: 'cursor', position: this.pendingCursor.position, color: this.pendingCursor.color });
            this.pendingCursor = null;
          }
        }, CURSOR_THROTTLE_MS - (now - this.lastCursorSend));
      }
    }
  }

  requestHistory(): void {
    this.send({ type: 'request-history' });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.cursorTimer) {
      clearTimeout(this.cursorTimer);
      this.cursorTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this._isConnected = false;
    this.messageHandlers.clear();
  }
}

export const wsClient = new WebSocketClient();
