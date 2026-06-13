import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import ideasRouter from './routes/ideas.js';
import './db.js';

const app = express();
app.use(express.json());
app.use('/api', ideasRouter);

const server = createServer(app);

const wss = new WebSocketServer({ server });

interface RoomClients {
  [roomCode: string]: Set<WebSocket>;
}

const roomClients: RoomClients = {};
const clientRoomMap = new Map<WebSocket, { roomCode: string; nickname: string }>();

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'join') {
        const { roomCode, nickname } = msg;
        if (!roomClients[roomCode]) {
          roomClients[roomCode] = new Set();
        }
        roomClients[roomCode].add(ws);
        clientRoomMap.set(ws, { roomCode, nickname });

        const members = Array.from(roomClients[roomCode] || [])
          .map((client) => clientRoomMap.get(client)?.nickname)
          .filter(Boolean);

        broadcastToRoom(roomCode, {
          type: 'members',
          members,
        });
      }

      if (msg.type === 'new_idea') {
        const roomCode = clientRoomMap.get(ws)?.roomCode;
        if (roomCode) {
          broadcastToRoom(roomCode, {
            type: 'new_idea',
            idea: msg.idea,
          });
        }
      }

      if (msg.type === 'vote_update') {
        const roomCode = clientRoomMap.get(ws)?.roomCode;
        if (roomCode) {
          broadcastToRoom(roomCode, {
            type: 'vote_update',
            idea_id: msg.idea_id,
            vote_count: msg.vote_count,
          });
        }
      }

      if (msg.type === 'new_comment') {
        const roomCode = clientRoomMap.get(ws)?.roomCode;
        if (roomCode) {
          broadcastToRoom(roomCode, {
            type: 'new_comment',
            idea_id: msg.idea_id,
            comment: msg.comment,
            comment_count: msg.comment_count,
          });
        }
      }
    } catch (e) {
      console.error('WebSocket message parse error:', e);
    }
  });

  ws.on('close', () => {
    const info = clientRoomMap.get(ws);
    if (info) {
      const { roomCode } = info;
      roomClients[roomCode]?.delete(ws);
      if (roomClients[roomCode]?.size === 0) {
        delete roomClients[roomCode];
      } else {
        const members = Array.from(roomClients[roomCode] || [])
          .map((client) => clientRoomMap.get(client)?.nickname)
          .filter(Boolean);
        broadcastToRoom(roomCode, {
          type: 'members',
          members,
        });
      }
      clientRoomMap.delete(ws);
    }
  });
});

function broadcastToRoom(roomCode: string, data: object) {
  const clients = roomClients[roomCode];
  if (!clients) return;
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
