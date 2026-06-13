import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { ClientMessage } from '../types';
import { roomManager } from './roomManager';
import { snapshotManager } from './snapshotManager';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const shareCodes = new Map<string, string>();
const roomToShareCode = new Map<string, string>();

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.post('/api/share/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  let shareCode = roomToShareCode.get(roomId);
  if (!shareCode) {
    shareCode = generateShareCode();
    shareCodes.set(shareCode, roomId);
    roomToShareCode.set(roomId, shareCode);
  }
  
  res.json({ shareCode });
});

app.get('/api/share/:shareCode', (req, res) => {
  const { shareCode } = req.params;
  const roomId = shareCodes.get(shareCode);
  
  if (!roomId) {
    res.status(404).json({ error: 'Share code not found' });
    return;
  }
  
  res.json({ roomId });
});

app.get('/api/snapshots/:roomId', (req, res) => {
  const { roomId } = req.params;
  const snapshots = snapshotManager.getSnapshots(roomId);
  res.json(snapshots);
});

app.post('/api/snapshots/:roomId/restore', (req, res) => {
  const { roomId } = req.params;
  const { snapshotId } = req.body;
  
  const snapshot = snapshotManager.restoreSnapshot(roomId, snapshotId);
  if (!snapshot) {
    res.status(404).json({ success: false, error: 'Snapshot not found' });
    return;
  }
  
  const room = roomManager.getRoom(roomId);
  if (room) {
    room.users.forEach(user => {
      const message = {
        type: 'init-state',
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        users: room.users,
      };
      const client = room.clients.get(user.id);
      if (client && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  res.json({ success: true });
});

wss.on('connection', (ws) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  ws.on('message', (data) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join': {
          currentRoomId = message.roomId;
          currentUserId = message.userId;
          
          const { room } = roomManager.joinRoom(
            message.roomId,
            message.userId,
            message.userName,
            ws
          );
          
          setTimeout(() => {
            roomManager.sendInitState(message.roomId, message.userId);
          }, 100);
          break;
        }
        case 'leave': {
          if (currentRoomId && currentUserId) {
            roomManager.leaveRoom(currentRoomId, currentUserId);
          }
          break;
        }
        case 'node-add':
        case 'node-update':
        case 'node-delete':
        case 'edge-add':
        case 'edge-update':
        case 'edge-delete':
        case 'cursor-move': {
          if (currentRoomId && currentUserId) {
            roomManager.applyOperation(currentRoomId, message, currentUserId);
          }
          break;
        }
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentUserId) {
      roomManager.leaveRoom(currentRoomId, currentUserId);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
