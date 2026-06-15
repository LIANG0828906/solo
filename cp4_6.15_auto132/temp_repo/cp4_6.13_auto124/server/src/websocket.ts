import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';

export type EventCategory = 'meeting' | 'task' | 'deadline' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  start: string;
  end: string;
  assignee: string;
}

export type WSMessageType = 
  | 'event_created' 
  | 'event_updated' 
  | 'event_deleted' 
  | 'heartbeat' 
  | 'user_online' 
  | 'user_offline'
  | 'pong';

export interface WSMessage {
  type: WSMessageType;
  payload: CalendarEvent | string | { userId: string };
}

const HEARTBEAT_INTERVAL = 30000;
const CLIENT_TIMEOUT = 45000;

interface ClientData {
  userId: string;
  lastHeartbeat: number;
  isAlive: boolean;
}

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map<WebSocket, ClientData>();
  const onlineUsers = new Set<string>();

  const broadcast = (message: WSMessage) => {
    const data = JSON.stringify(message);
    clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  const broadcastUserStatus = (userId: string, online: boolean) => {
    broadcast({
      type: online ? 'user_online' : 'user_offline',
      payload: { userId }
    });
  };

  const checkHeartbeats = () => {
    const now = Date.now();
    clients.forEach((data, client) => {
      if (!data.isAlive || now - data.lastHeartbeat > CLIENT_TIMEOUT) {
        const userId = data.userId;
        clients.delete(client);
        client.terminate();
        let userStillOnline = false;
        clients.forEach((d) => {
          if (d.userId === userId) userStillOnline = true;
        });
        if (!userStillOnline && onlineUsers.has(userId)) {
          onlineUsers.delete(userId);
          broadcastUserStatus(userId, false);
        }
      } else {
        client.ping();
      }
    });
  };

  setInterval(checkHeartbeats, HEARTBEAT_INTERVAL);

  wss.on('connection', (ws) => {
    const clientId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    clients.set(ws, {
      userId: clientId,
      lastHeartbeat: Date.now(),
      isAlive: true
    });

    onlineUsers.add(clientId);
    broadcastUserStatus(clientId, true);

    onlineUsers.forEach((userId) => {
      if (userId !== clientId) {
        ws.send(JSON.stringify({
          type: 'user_online' as const,
          payload: { userId }
        }));
      }
    });

    ws.on('message', (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === 'heartbeat') {
          const clientData = clients.get(ws);
          if (clientData) {
            clientData.lastHeartbeat = Date.now();
            clientData.isAlive = true;
            ws.send(JSON.stringify({ type: 'pong', payload: 'ok' }));
          }
          return;
        }

        if (message.type === 'event_created' || 
            message.type === 'event_updated' || 
            message.type === 'event_deleted') {
          broadcast(message);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });

    ws.on('pong', () => {
      const clientData = clients.get(ws);
      if (clientData) {
        clientData.lastHeartbeat = Date.now();
        clientData.isAlive = true;
      }
    });

    ws.on('close', () => {
      const clientData = clients.get(ws);
      if (clientData) {
        const userId = clientData.userId;
        clients.delete(ws);
        let userStillOnline = false;
        clients.forEach((d) => {
          if (d.userId === userId) userStillOnline = true;
        });
        if (!userStillOnline && onlineUsers.has(userId)) {
          onlineUsers.delete(userId);
          broadcastUserStatus(userId, false);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  const broadcastEventCreated = (event: CalendarEvent) => {
    broadcast({ type: 'event_created', payload: event });
  };

  const broadcastEventUpdated = (event: CalendarEvent) => {
    broadcast({ type: 'event_updated', payload: event });
  };

  const broadcastEventDeleted = (eventId: string) => {
    broadcast({ type: 'event_deleted', payload: eventId });
  };

  return {
    wss,
    broadcastEventCreated,
    broadcastEventUpdated,
    broadcastEventDeleted,
    getOnlineUsers: () => Array.from(onlineUsers)
  };
}
