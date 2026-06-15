import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { ClientMessage } from '../types';
import { roomManager } from './roomManager';
import { snapshotManager } from './snapshotManager';
import fs from 'fs';
import path from 'path';
import { Logger, globalLogger } from './logger';

const DATA_DIR = path.join(process.cwd(), 'data');
const logger = new Logger('Server');

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

function sendError(ws: WebSocket, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'error', message }));
  }
}

app.post('/api/share/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    let shareCode = roomToShareCode.get(roomId);
    if (!shareCode) {
      shareCode = generateShareCode();
      shareCodes.set(shareCode, roomId);
      roomToShareCode.set(roomId, shareCode);
    }

    res.json({ shareCode });
  } catch (e) {
    logger.error('Error in POST /api/share/:roomId', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/share/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params;
    const roomId = shareCodes.get(shareCode);

    if (!roomId) {
      res.status(404).json({ error: 'Share code not found' });
      return;
    }

    res.json({ roomId });
  } catch (e) {
    logger.error('Error in GET /api/share/:shareCode', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/snapshots/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const snapshots = snapshotManager.getSnapshots(roomId);
    res.json(snapshots);
  } catch (e) {
    logger.error('Error in GET /api/snapshots/:roomId', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/snapshots/:roomId/restore', async (req, res) => {
  try {
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
          try {
            client.send(JSON.stringify(message));
          } catch (e) {
            logger.error(`Failed to send restored state to user ${user.id}`, e);
          }
        }
      });
    }

    res.json({ success: true });
  } catch (e) {
    logger.error('Error in POST /api/snapshots/:roomId/restore', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/logs', (_req, res) => {
  try {
    const logs = globalLogger.getLogs();
    res.json(logs);
  } catch (e) {
    logger.error('Error in GET /api/logs', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

wss.on('connection', (ws) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  ws.on('message', async (data) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'join': {
          try {
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
          } catch (e) {
            logger.error(`Error processing join message for user ${message.userId}`, e);
            sendError(ws, 'Failed to join room');
          }
          break;
        }
        case 'leave': {
          try {
            if (currentRoomId && currentUserId) {
              roomManager.leaveRoom(currentRoomId, currentUserId);
            }
          } catch (e) {
            logger.error(`Error processing leave message for user ${currentUserId}`, e);
            sendError(ws, 'Failed to leave room');
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
          try {
            if (currentRoomId && currentUserId) {
              roomManager.applyOperation(currentRoomId, message, currentUserId);
            }
          } catch (e) {
            logger.error(`Error processing operation ${message.type} for user ${currentUserId}`, e);
            sendError(ws, `Failed to process ${message.type}`);
          }
          break;
        }
        default: {
          logger.warn(`Unknown message type: ${(message as any).type}`);
          sendError(ws, `Unknown message type: ${(message as any).type}`);
        }
      }
    } catch (e) {
      logger.error('Error parsing WebSocket message', e);
      sendError(ws, 'Invalid message format');
    }
  });

  ws.on('close', () => {
    try {
      if (currentRoomId && currentUserId) {
        roomManager.leaveRoom(currentRoomId, currentUserId);
      }
    } catch (e) {
      logger.error(`Error during WebSocket close for user ${currentUserId}`, e);
    }
  });

  ws.on('error', (e) => {
    logger.error(`WebSocket error for user ${currentUserId}`, e);
  });
});

async function initDataDir(): Promise<void> {
  try {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.mkdir(path.join(DATA_DIR, 'rooms'), { recursive: true });
    await fs.promises.mkdir(path.join(DATA_DIR, 'snapshots'), { recursive: true });
    logger.info('Data directories initialized');
  } catch (e) {
    logger.error('Failed to initialize data directories', e);
  }
}

async function restoreData(): Promise<void> {
  logger.info('Starting data restoration...');
  await Promise.all([
    roomManager.loadAllRooms(),
    snapshotManager.loadAllSnapshots(),
  ]);
  logger.info('Data restoration completed');
}

async function startServer(): Promise<void> {
  await initDataDir();
  await restoreData();

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`WebSocket server ready`);
    logger.info(`Data directory: ${DATA_DIR}`);
  });
}

startServer();
