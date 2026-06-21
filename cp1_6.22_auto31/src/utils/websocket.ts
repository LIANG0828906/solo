import type { WSMessage, WSHandler } from '../types';

type ListenerMap = Map<string, Set<WSHandler>>;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: ListenerMap = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private manualClose = false;
  private onOpenCallback?: () => void;

  constructor(url: string) {
    this.url = url;
  }

  connect(onOpen?: () => void) {
    this.onOpenCallback = onOpen;
    this.manualClose = false;
    this.doConnect();
  }

  private doConnect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.onOpenCallback) this.onOpenCallback();
        this.startHeartbeat();
      };
      this.ws.onmessage = (ev) => {
        try {
          const msg: WSMessage = JSON.parse(ev.data);
          this.emit(msg.type, msg);
        } catch (e) {
          console.error('Parse error', e);
        }
      };
      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.manualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  on(type: string, handler: WSHandler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: WSHandler) {
    this.listeners.get(type)?.delete(handler);
  }

  private emit(type: string, msg: WSMessage) {
    this.listeners.get(type)?.forEach((h) => {
      try {
        h(msg);
      } catch (e) {
        console.error('Handler error', e);
      }
    });
  }

  send(type: string, payload: any = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }

  close() {
    this.manualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  get isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const createWSClient = (url: string) => new WebSocketClient(url);
