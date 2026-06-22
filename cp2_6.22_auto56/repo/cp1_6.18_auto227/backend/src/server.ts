import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { createTaskRouter } from './taskRoutes';
import { TaskEngine } from './taskEngine';
import { WSMessage, UserCursor } from './types';

const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json());

interface ClientConnection {
  ws: WebSocket;
  userId: string;
}

const clients = new Map<string, ClientConnection>();

const broadcast = (message: object, excludeUserId?: string) => {
  const msgStr = JSON.stringify(message);
  clients.forEach((client, userId) => {
    if (userId !== excludeUserId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(msgStr);
      } catch (error) {
        console.error('Broadcast error for user', userId, error);
      }
    }
  });
};

const taskEngine = new TaskEngine(broadcast);

app.use('/api/tasks', createTaskRouter(taskEngine));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedUsers: clients.size,
    tasks: taskEngine.getAllTasks().length,
    timestamp: Date.now()
  });
});

const server = http.createServer(app);

const wss = new WebSocketServer({
  server,
  path: '/api/ws'
});

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const parsedUrl = url.parse(req.url || '', true);
  const userId = (parsedUrl.query.userId as string) || `anon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  clients.set(userId, { ws, userId });
  console.log(`User connected: ${userId}. Total: ${clients.size}`);

  try {
    ws.send(JSON.stringify({
      type: 'tasks_sync',
      data: taskEngine.getAllTasks()
    }));
  } catch (error) {
    console.error('Error sending initial sync:', error);
  }

  broadcast({
    type: 'user_join',
    data: {
      userId,
      timestamp: Date.now()
    }
  }, userId);

  ws.on('message', (rawData: string) => {
    try {
      const message: WSMessage = JSON.parse(rawData.toString());

      switch (message.type) {
        case 'cursor_move': {
          const cursor = message.data as UserCursor;
          if (cursor && cursor.userId) {
            cursor.timestamp = Date.now();
            broadcast({
              type: 'cursor_move',
              data: cursor
            }, cursor.userId);
          }
          break;
        }
        case 'ping': {
          try {
            ws.send(JSON.stringify({
              type: 'pong',
              data: { timestamp: Date.now() }
            }));
          } catch (error) {
            console.error('Error sending pong:', error);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error parsing message from user', userId, error);
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`User disconnected: ${userId}. Total: ${clients.size}`);

    broadcast({
      type: 'user_leave',
      data: userId
    });
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
  });
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     协作时光轴 - Collaboration Timeline Server         ║
╠══════════════════════════════════════════════════════════╣
║  REST API:      http://localhost:${PORT}/api             ║
║  WebSocket:     ws://localhost:${PORT}/api/ws            ║
║  Health check:  http://localhost:${PORT}/api/health      ║
╠══════════════════════════════════════════════════════════╣
║  Frontend dev:  http://localhost:5173                    ║
║  (proxy /api -> http://localhost:${PORT})                ║
╚══════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  wss.close(() => {
    console.log('WebSocket server closed');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});
