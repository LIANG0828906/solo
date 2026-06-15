import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

export type WSEventType = 'status_updated' | 'comment_added' | 'history_updated' | 'version_uploaded';

export interface WSMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

interface WSClientState {
  subscribed: boolean;
  connectedAt: number;
}

class WSManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, WSClientState> = new Map();

  init(server: HttpServer): void {
    if (this.wss) {
      console.log('WebSocket server already initialized');
      return;
    }

    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      
      const clientState: WSClientState = {
        subscribed: false,
        connectedAt: Date.now(),
      };
      this.clients.set(ws, clientState);

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received WebSocket message:', message);

          if (message.type === 'subscribe') {
            clientState.subscribed = true;
            const state = this.clients.get(ws);
            if (state) {
              state.subscribed = true;
            }
            const ackMessage = {
              type: 'subscribe_ack',
              payload: {
                success: true,
                subscribedAt: Date.now(),
                events: ['status_updated', 'comment_added', 'history_updated', 'version_uploaded'],
              },
              timestamp: Date.now(),
            };
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(ackMessage), (err) => {
                if (err) {
                  console.error('Failed to send subscribe_ack:', err);
                }
              });
            }
            console.log('Client subscribed to events successfully');
          } else if (message.type === 'ping') {
            const pongMessage = {
              type: 'pong',
              payload: { serverTime: Date.now() },
              timestamp: Date.now(),
            };
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(pongMessage));
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          const errorMessage = {
            type: 'error',
            payload: { code: 'PARSE_ERROR', message: 'Invalid JSON' },
            timestamp: Date.now(),
          };
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(errorMessage));
          }
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`WebSocket client disconnected (code=${code})`);
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.clients.delete(ws);
      });

      const connectedMessage = {
        type: 'connected',
        payload: {
          message: 'Connected to contract approval server',
          serverTime: Date.now(),
          protocol: 'Please send { type: "subscribe" } to start receiving events',
        },
        timestamp: Date.now(),
      };
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(connectedMessage), (err) => {
          if (err) {
            console.error('Failed to send connected message:', err);
          }
        });
      }
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
    let skippedCount = 0;

    this.clients.forEach((state, client) => {
      if (client.readyState === WebSocket.OPEN && state.subscribed) {
        client.send(messageStr, (err) => {
          if (err) {
            console.error('Failed to send WebSocket message:', err);
          }
        });
        sentCount++;
      } else {
        skippedCount++;
      }
    });

    console.log(
      `Broadcasted "${type}" to ${sentCount} subscribed client(s) (skipped ${skippedCount} unsubscribed)`
    );
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getSubscribedCount(): number {
    let count = 0;
    this.clients.forEach((state) => {
      if (state.subscribed) count++;
    });
    return count;
  }
}

export default new WSManager();
