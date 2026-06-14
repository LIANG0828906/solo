import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

export type WSEventType = 'status_updated' | 'comment_added' | 'history_updated' | 'version_uploaded';

export interface WSMessage {
  type: WSEventType;
  payload: unknown;
  timestamp: number;
}

class WSManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  init(server: HttpServer): void {
    if (this.wss) {
      console.log('WebSocket server already initialized');
      return;
    }

    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received WebSocket message:', message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.clients.delete(ws);
      });

      ws.send(
        JSON.stringify({
          type: 'connected',
          payload: { message: 'Connected to contract approval server' },
          timestamp: Date.now(),
        })
      );
    });

    console.log('WebSocket server initialized on /ws path');
  }

  broadcast(type: WSEventType, payload: unknown): void {
    if (!this.wss) {
      console.warn('WebSocket server not initialized, cannot broadcast');
      return;
    }

    const message: WSMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr, (err) => {
          if (err) {
            console.error('Failed to send WebSocket message:', err);
          }
        });
        sentCount++;
      }
    });

    console.log(`Broadcasted "${type}" to ${sentCount} client(s)`);
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export default new WSManager();
