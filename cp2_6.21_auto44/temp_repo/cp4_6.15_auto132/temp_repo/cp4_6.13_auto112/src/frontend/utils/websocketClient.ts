export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface WSMessage {
  type: string;
  channel?: string;
  data?: unknown;
  clientId?: string;
  timestamp?: number;
}

type DataCallback = (data: unknown) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = 'disconnected';
  private channels: Set<string> = new Set();
  private dataCallbacks: Map<string, DataCallback[]> = new Map();
  private statusCallbacks: StatusCallback[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.channels.forEach((channel) => {
          this.send({ type: 'register', channel });
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          if (message.type === 'data' && message.channel) {
            this.triggerDataCallbacks(message.channel, message.data);
          } else if (message.type === 'drilldown') {
            this.triggerDataCallbacks('drilldown', message.data);
          } else if (message.type === 'welcome') {
            console.log('WebSocket connected:', message.clientId);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('disconnected');
      };
    } catch (e) {
      console.error('Error creating WebSocket:', e);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 5000);
      this.connect();
    }, this.reconnectDelay);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  private triggerDataCallbacks(channel: string, data: unknown): void {
    const callbacks = this.dataCallbacks.get(channel);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  send(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(channel: string, callback: DataCallback): () => void {
    if (!this.dataCallbacks.has(channel)) {
      this.dataCallbacks.set(channel, []);
    }
    this.dataCallbacks.get(channel)!.push(callback);

    if (!this.channels.has(channel)) {
      this.channels.add(channel);
      if (this.status === 'connected') {
        this.send({ type: 'register', channel });
      }
    }

    return () => {
      this.unsubscribe(channel, callback);
    };
  }

  unsubscribe(channel: string, callback: DataCallback): void {
    const callbacks = this.dataCallbacks.get(channel);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    callback(this.status);

    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  setFrequency(frequency: number): void {
    this.send({ type: 'setFrequency', frequency });
  }

  requestDrillDown(chartType: string, dataPoint: unknown): void {
    this.send({ type: 'drilldown', chartType, dataPoint });
  }

  resetData(): void {
    this.send({ type: 'reset' });
  }
}

const wsClient = new WebSocketClient(
  window.location.protocol === 'https:'
    ? `wss://${window.location.host}/ws`
    : `ws://${window.location.host}/ws`
);

export default wsClient;
