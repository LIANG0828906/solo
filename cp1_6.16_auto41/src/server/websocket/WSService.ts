import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import { PetService } from '../services/PetService';

interface ClientMap {
  [userId: string]: WebSocket;
}

export class WSService {
  private wss: WebSocketServer;
  private clients: ClientMap = {};
  private lastBroadcastTime = 0;
  private broadcastInterval = 1000;

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupConnectionHandler();
    this.startDecayScheduler();
  }

  private setupConnectionHandler(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      let userId: string | null = null;

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          
          if (message.type === 'auth' && message.userId) {
            userId = message.userId;
            this.clients[userId] = ws;
            this.sendToUser(userId, {
              type: 'connected',
              data: { message: 'WebSocket连接成功' },
            });
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      });

      ws.on('close', () => {
        if (userId) {
          delete this.clients[userId];
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private startDecayScheduler(): void {
    setInterval(() => {
      PetService.calculateDecayForAll();
      this.broadcastAllStates();
    }, 600000);
  }

  private broadcastAllStates(): void {
    const now = Date.now();
    if (now - this.lastBroadcastTime < this.broadcastInterval) {
      return;
    }
    this.lastBroadcastTime = now;

    for (const [userId, ws] of Object.entries(this.clients)) {
      if (ws.readyState === WebSocket.OPEN) {
        const pet = PetService.getPet(userId);
        if (pet) {
          ws.send(JSON.stringify({
            type: 'stateUpdate',
            data: { pet },
          }));
        }
      }
    }
  }

  sendToUser(userId: string, message: { type: string; data: unknown }): boolean {
    const ws = this.clients[userId];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcastStateUpdate(userId: string, petData: unknown): void {
    const now = Date.now();
    if (now - this.lastBroadcastTime < this.broadcastInterval) {
      return;
    }

    this.sendToUser(userId, {
      type: 'stateUpdate',
      data: { pet: petData },
    });
  }

  broadcastFriendUpdate(friendId: string, updateData: unknown): void {
    this.sendToUser(friendId, {
      type: 'friendUpdate',
      data: updateData,
    });
  }

  getClientCount(): number {
    return Object.keys(this.clients).length;
  }
}

let wsServiceInstance: WSService | null = null;

export const initWSService = (server: HTTPServer): WSService => {
  if (!wsServiceInstance) {
    wsServiceInstance = new WSService(server);
  }
  return wsServiceInstance;
};

export const getWSService = (): WSService | null => {
  return wsServiceInstance;
};
