import type { Order, Fabric } from './types';

const WS_URL = 'ws://localhost:3001/ws';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000;

type OrderUpdateCallback = (order: Order) => void;
type OrderDeleteCallback = (orderId: string) => void;
type FabricAlertCallback = (alert: any) => void;

class WebSocketClient {
  private static instance: WebSocketClient | null = null;
  private ws: WebSocket | null = null;
  private orderUpdateCallbacks: OrderUpdateCallback[] = [];
  private orderDeleteCallbacks: OrderDeleteCallback[] = [];
  private fabricAlertCallbacks: FabricAlertCallback[] = [];
  private connectionChangeCallbacks: ((connected: boolean) => void)[] = [];
  private retryCount = 0;
  private isManuallyDisconnected = false;

  private constructor() {}

  static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManuallyDisconnected = false;
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.retryCount = 0;
      this.connectionChangeCallbacks.forEach((cb) => cb(true));
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event === 'orderUpdates') {
          if (message.data.type === 'created' || message.data.type === 'statusChanged') {
            this.orderUpdateCallbacks.forEach((cb) => cb(message.data.order));
          } else if (message.data.type === 'deleted') {
            this.orderDeleteCallbacks.forEach((cb) => cb(message.data.orderId));
          }
        } else if (message.event === 'fabricAlerts') {
          this.fabricAlertCallbacks.forEach((cb) => cb(message.data));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.connectionChangeCallbacks.forEach((cb) => cb(false));
      if (!this.isManuallyDisconnected && this.retryCount < MAX_RETRIES) {
        this.retryCount++;
        console.log(`Reconnecting... (${this.retryCount}/${MAX_RETRIES})`);
        setTimeout(() => this.connect(), RETRY_INTERVAL);
      }
    };
  }

  onOrderUpdate(callback: OrderUpdateCallback): () => void {
    this.orderUpdateCallbacks.push(callback);
    return () => {
      this.orderUpdateCallbacks = this.orderUpdateCallbacks.filter((cb) => cb !== callback);
    };
  }

  onOrderDelete(callback: OrderDeleteCallback): () => void {
    this.orderDeleteCallbacks.push(callback);
    return () => {
      this.orderDeleteCallbacks = this.orderDeleteCallbacks.filter((cb) => cb !== callback);
    };
  }

  onFabricAlert(callback: FabricAlertCallback): () => void {
    this.fabricAlertCallbacks.push(callback);
    return () => {
      this.fabricAlertCallbacks = this.fabricAlertCallbacks.filter((cb) => cb !== callback);
    };
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.retryCount = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionChangeCallbacks.push(callback);
    callback(this.isConnected());
    return () => {
      this.connectionChangeCallbacks = this.connectionChangeCallbacks.filter((cb) => cb !== callback);
    };
  }
}

const wsClient = WebSocketClient.getInstance();

export function connect(): void {
  wsClient.connect();
}

export function onOrderUpdate(callback: OrderUpdateCallback): () => void {
  return wsClient.onOrderUpdate(callback);
}

export function onOrderDelete(callback: OrderDeleteCallback): () => void {
  return wsClient.onOrderDelete(callback);
}

export function onFabricAlert(callback: FabricAlertCallback): () => void {
  return wsClient.onFabricAlert(callback);
}

export function disconnect(): void {
  wsClient.disconnect();
}

export function isConnected(): boolean {
  return wsClient.isConnected();
}

export function onConnectionChange(callback: (connected: boolean) => void): () => void {
  return wsClient.onConnectionChange(callback);
}
