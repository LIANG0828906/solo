import { ClientMessage, ServerMessage, ChordOp, LyricOp } from '../types';

type MessageHandler = (message: ServerMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string = '';

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.url = url;
      
      try {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message: ServerMessage = JSON.parse(event.data);
            this.handlers.forEach(handler => handler(message));
          } catch (error) {
            console.error('WebSocket message parse error:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.url).catch(() => {
          console.error('Reconnection failed');
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued');
    }
  }

  join(songId: string, userId: string, userName: string): void {
    this.send({
      type: 'join',
      songId,
      userId,
      userName
    });
  }

  leave(songId: string, userId: string): void {
    this.send({
      type: 'leave',
      songId,
      userId
    });
  }

  sendChordAdd(songId: string, userId: string, payload: ChordOp): void {
    this.send({
      type: 'chord_add',
      songId,
      payload: { ...payload, userId }
    });
  }

  sendChordRemove(songId: string, userId: string, payload: Omit<ChordOp, 'chord'>): void {
    this.send({
      type: 'chord_remove',
      songId,
      payload: { ...payload, userId } as ChordOp & { userId: string }
    });
  }

  sendLyricUpdate(songId: string, userId: string, payload: LyricOp): void {
    this.send({
      type: 'lyric_update',
      songId,
      payload: { ...payload, userId }
    });
  }

  sendCursorMove(
    songId: string,
    userId: string,
    userName: string,
    measure: number,
    position: number,
    type: 'lyric' | 'chord'
  ): void {
    this.send({
      type: 'cursor_move',
      songId,
      payload: { measure, position, type, userId, userName }
    });
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
