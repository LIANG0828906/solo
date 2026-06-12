import { ClientMessage, ServerMessage, UserInfo, Shape, Point } from './types';

type MessageHandler = (msg: ServerMessage) => void;

const CURSOR_THROTTLE_MS = 16;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private lastCursorSend = 0;
  private pendingCursor: { position: Point | null; color: string } | null = null;
  private cursorTimer: number | null = null;

  connect(url: string = '/ws'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = url.startsWith('ws') ? url : `${protocol}//${window.location.host}${url}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg: ServerMessage = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(msg));
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          if (this.reconnectAttempts === 0) {
            reject(err);
          }
        };

        this.ws.onclose = () => {
          this.scheduleReconnect(url);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  private scheduleReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      this.connect(url);
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
      this.ws.send(JSON.stringify(message));
    }
  }

  sendDraw(shape: Shape): void {
    this.send({ type: 'draw', shape });
  }

  sendUndo(): void {
    this.send({ type: 'undo' });
  }

  sendRedo(): void {
    this.send({ type: 'redo' });
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
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }
}

export const wsClient = new WebSocketClient();
