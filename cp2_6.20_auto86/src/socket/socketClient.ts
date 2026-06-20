import { io, Socket } from 'socket.io-client';
import type { WSMessage } from '../types';

class SocketClient {
  private socket: Socket | null = null;
  private userId: string = '';
  private mindmapId: string = '';
  private messageQueue: WSMessage[] = [];
  private lastSendTime: number = 0;
  private readonly MAX_MESSAGES_PER_SECOND = 30;
  private readonly MIN_INTERVAL = 1000 / this.MAX_MESSAGES_PER_SECOND;
  private pendingMessages: Map<string, (success: boolean, error?: string) => void> = new Map();
  private messageTimeout: number = 3000;

  connect(userId: string, mindmapId: string): Socket {
    this.userId = userId;
    this.mindmapId = mindmapId;

    this.socket = io('http://localhost:8000', {
      path: '/ws/mindmap',
      query: {
        userId,
        mindmapId,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.flushQueue();
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('message', (message: WSMessage) => {
      this.handleIncomingMessage(message);
    });

    this.socket.on('ack', (messageId: string, success: boolean, error?: string) => {
      const callback = this.pendingMessages.get(messageId);
      if (callback) {
        callback(success, error);
        this.pendingMessages.delete(messageId);
      }
    });

    return this.socket;
  }

  private handleIncomingMessage(message: WSMessage) {
    if (message.userId === this.userId) {
      return;
    }

    const event = new CustomEvent(`mindmap:${message.type}`, {
      detail: message.data,
    });
    window.dispatchEvent(event);
  }

  send(type: string, data: any): Promise<{ success: boolean; error?: string }> {
    const messageId = `${this.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: WSMessage = {
      type,
      userId: this.userId,
      mindmapId: this.mindmapId,
      data,
      timestamp: Date.now(),
      messageId,
    };

    if (!this.socket || !this.socket.connected) {
      this.enqueueMessage(message);
      return Promise.resolve({ success: true });
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        resolve({ success: true });
      }, this.messageTimeout);

      this.pendingMessages.set(messageId, (success, error) => {
        clearTimeout(timeoutId);
        resolve({ success, error });
      });

      this.enqueueMessage(message);
    });
  }

  private enqueueMessage(message: WSMessage) {
    this.messageQueue.push(message);
    this.flushQueue();
  }

  private flushQueue() {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    const now = Date.now();
    const timeSinceLastSend = now - this.lastSendTime;

    if (timeSinceLastSend < this.MIN_INTERVAL) {
      setTimeout(() => this.flushQueue(), this.MIN_INTERVAL - timeSinceLastSend);
      return;
    }

    const message = this.messageQueue.shift();
    if (message) {
      this.socket.emit('message', message);
      this.lastSendTime = Date.now();

      if (this.messageQueue.length > 0) {
        setTimeout(() => this.flushQueue(), this.MIN_INTERVAL);
      }
    }
  }

  on(event: string, callback: (data: any) => void) {
    window.addEventListener(`mindmap:${event}`, (e: any) => {
      callback(e.detail);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.pendingMessages.clear();
    this.messageQueue = [];
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();
export default socketClient;
