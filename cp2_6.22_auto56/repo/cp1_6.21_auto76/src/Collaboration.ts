type MessageHandler = (data: any) => void;

class Collaboration {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private url: string;
  private roomId: string;
  private userId: string;

  constructor(url: string, roomId: string, userId: string) {
    this.url = url;
    this.roomId = roomId;
    this.userId = userId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:3001/ws?roomId=${this.roomId}&userId=${this.userId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.startHeartbeat();
          resolve();
        };

        this.ws.onerror = (err) => {
          reject(err);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'heartbeat') return;
            this.emit(data.type, data.payload);
          } catch {
            // ignore non-JSON
          }
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          this.reconnectTimeout = setTimeout(() => {
            this.connect().catch(() => {});
          }, 3000);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type,
          payload,
          roomId: this.roomId,
          userId: this.userId,
          timestamp: Date.now(),
        })
      );
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  private emit(type: string, payload: any) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((h) => h(payload));
    }
    const allHandlers = this.handlers.get('*');
    if (allHandlers) {
      allHandlers.forEach((h) => h({ type, payload }));
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send('heartbeat', {});
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  get connected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

let instance: Collaboration | null = null;

export function createCollaboration(url: string, roomId: string, userId: string): Collaboration {
  instance = new Collaboration(url, roomId, userId);
  return instance;
}

export function getCollaboration(): Collaboration | null {
  return instance;
}

export default Collaboration;
