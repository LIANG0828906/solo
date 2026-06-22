import { StickyNote, ServerMessage } from '../types';

type MessageHandler = (message: ServerMessage) => void;

export class CollabSync {
  private ws: WebSocket | null = null;
  private roomId: string;
  private clientId: string | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private heartbeatInterval: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onConnectionChange: (connected: boolean) => void;
  private onOnlineCountChange: (count: number) => void;

  constructor(
    roomId: string,
    onConnectionChange: (connected: boolean) => void,
    onOnlineCountChange: (count: number) => void
  ) {
    this.roomId = roomId;
    this.onConnectionChange = onConnectionChange;
    this.onOnlineCountChange = onOnlineCountChange;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:3002`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
        this.send('join', { roomId: this.roomId });
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onConnectionChange(false);
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('Error connecting WebSocket:', e);
      this.attemptReconnect();
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  private handleMessage(message: ServerMessage) {
    const { type, payload, clientId } = message;

    if (type === 'init' && clientId) {
      this.clientId = clientId;
    }

    if (type === 'onlineCount') {
      this.onOnlineCountChange(payload.onlineCount);
    }

    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
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
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type,
          roomId: this.roomId,
          payload,
        })
      );
    }
  }

  addNote(x: number, y: number, color: string, sidebarColor: string) {
    this.send('addNote', { x, y, color, sidebarColor });
  }

  updateNote(note: Partial<StickyNote> & { id: string }) {
    this.send('updateNote', note);
  }

  deleteNote(id: string) {
    this.send('deleteNote', { id });
  }

  voteNote(noteId: string, voterId: string) {
    this.send('voteNote', { noteId, voterId });
  }

  addDrawing(points: { x: number; y: number }[], color: string, lineWidth: number) {
    this.send('addDrawing', { points, color, lineWidth });
  }

  undoDrawing() {
    this.send('undoDrawing', {});
  }

  getClientId(): string | null {
    return this.clientId;
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
