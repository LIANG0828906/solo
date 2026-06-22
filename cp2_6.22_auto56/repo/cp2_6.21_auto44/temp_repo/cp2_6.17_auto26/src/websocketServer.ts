import { WebSocketServer, WebSocket } from 'ws';
import type { WsMessage, User } from '@/types';

const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

interface ClientData {
  ws: WebSocket;
  userId: string;
  user: User | null;
}

const clients = new Map<string, ClientData>();

console.log(`[WebSocket Server] Starting on port ${PORT}...`);

wss.on('connection', (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(2, 9);
  console.log(`[WebSocket Server] New client connected: ${clientId}`);

  clients.set(clientId, { ws, userId: clientId, user: null });

  const allUsers: User[] = Array.from(clients.values())
    .filter((c) => c.user !== null)
    .map((c) => c.user!);

  ws.send(
    JSON.stringify({
      type: 'init',
      payload: { clientId, users: allUsers },
      timestamp: Date.now(),
    })
  );

  broadcast(
    {
      type: 'user-join',
      payload: { clientId },
      userId: 'server',
      timestamp: Date.now(),
    },
    clientId
  );

  ws.on('message', (data: Buffer) => {
    try {
      const message: WsMessage = JSON.parse(data.toString());
      console.log(`[WebSocket Server] Received ${message.type} from ${message.userId}`);

      if (message.type === 'user-join' && message.payload?.user) {
        const client = clients.get(clientId);
        if (client) {
          client.user = message.payload.user;
        }

        const currentUsers = Array.from(clients.values())
          .filter((c) => c.user !== null)
          .map((c) => c.user!);

        broadcast(
          {
            type: 'users-update',
            payload: { users: currentUsers },
            userId: 'server',
            timestamp: Date.now(),
          }
        );
      }

      if (message.type === 'sync') {
        broadcast(message, clientId);
      }

      if (message.type === 'cursor') {
        broadcast(message, clientId);
      }

      if (message.type === 'edit') {
        broadcast(message, clientId);
      }

      if (message.type === 'annotation') {
        broadcast(message, clientId);
      }
    } catch (error) {
      console.error('[WebSocket Server] Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket Server] Client disconnected: ${clientId}`);
    clients.delete(clientId);

    const remainingUsers = Array.from(clients.values())
      .filter((c) => c.user !== null)
      .map((c) => c.user!);

    broadcast({
      type: 'users-update',
      payload: { users: remainingUsers },
      userId: 'server',
      timestamp: Date.now(),
    });

    broadcast(
      {
        type: 'user-leave',
        payload: { clientId },
        userId: 'server',
        timestamp: Date.now(),
      },
      clientId
    );
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket Server] Error for client ${clientId}:`, error);
  });
});

function broadcast(message: WsMessage, excludeClientId?: string) {
  const messageStr = JSON.stringify(message);
  for (const [clientId, client] of clients) {
    if (excludeClientId && clientId === excludeClientId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  }
}

console.log(`[WebSocket Server] Running on ws://localhost:${PORT}`);

process.on('SIGINT', () => {
  console.log('[WebSocket Server] Shutting down...');
  wss.close();
  process.exit(0);
});
