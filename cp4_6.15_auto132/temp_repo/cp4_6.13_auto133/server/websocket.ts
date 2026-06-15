import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface Connection {
  id: string;
  ws: WebSocket;
  room: string;
}

const connections = new Map<string, Connection>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws) => {
    const connectionId = uuidv4();
    const connection: Connection = {
      id: connectionId,
      ws,
      room: 'default'
    };
    connections.set(connectionId, connection);

    console.log(`Client connected: ${connectionId}`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'join' && message.room) {
          connection.room = message.room;
          console.log(`Client ${connectionId} joined room: ${message.room}`);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    ws.on('close', () => {
      connections.delete(connectionId);
      console.log(`Client disconnected: ${connectionId}`);
    });

    ws.send(JSON.stringify({ type: 'connected', id: connectionId }));
  });
}

export function broadcastToRoom(room: string, data: unknown) {
  const message = JSON.stringify(data);
  connections.forEach((conn) => {
    if (conn.room === room && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(message);
    }
  });
}

export function broadcastAll(data: unknown) {
  const message = JSON.stringify(data);
  connections.forEach((conn) => {
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(message);
    }
  });
}

export function getConnectionCount(): number {
  return connections.size;
}
