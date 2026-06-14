import { BoardState, WSMessage } from '../types';

type WSCallback = (msg: WSMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: WSCallback[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionId: string = '';
  private userId: string = '';

  connect(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.doConnect();
  }

  private doConnect() {
    if (this.ws) {
      this.ws.close();
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/ws?sessionId=${this.sessionId}&userId=${this.userId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.listeners.forEach((cb) => cb(msg));
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      this.reconnectTimer = setTimeout(() => this.doConnect(), 2000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(msg: WSMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  onMessage(cb: WSCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  sendOperation(type: string, params: Record<string, unknown>) {
    this.send({
      type: 'operation',
      userId: this.userId,
      sessionId: this.sessionId,
      operation: type as WSMessage['operation'],
      params,
    });
  }

  sendFullState(state: BoardState) {
    this.send({
      type: 'init',
      userId: this.userId,
      sessionId: this.sessionId,
      state,
    });
  }
}

export const wsService = new WebSocketService();
