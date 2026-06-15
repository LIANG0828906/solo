import WebSocket, { Server } from 'ws';
import jwt from 'jsonwebtoken';
import { users, books, exchanges, messages } from './app';

const JWT_SECRET = 'your-secret-key';

const wss = new Server({ port: 3002 });

const userConnections: Map<string, WebSocket> = new Map();

const sendNotification = (userId: string, data: object) => {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

wss.on('connection', (ws, request) => {
  const token = request.url?.split('token=')[1];
  if (!token) {
    ws.close();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;
    userConnections.set(userId, ws);

    ws.on('close', () => {
      userConnections.delete(userId);
    });

    ws.on('error', () => {
      userConnections.delete(userId);
    });
  } catch (error) {
    ws.close();
  }
});

export { sendNotification, wss, users, books, exchanges, messages };
