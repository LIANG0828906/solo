import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './RoomManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const roomManager = new RoomManager();
const userRoomMap: Map<string, string> = new Map();

app.use(express.json());

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const getSaveFilePath = (roomCode: string) => path.join(DATA_DIR, `${roomCode}.json`);

app.post('/api/save', (req, res) => {
  const { roomCode, nodes, connections } = req.body;
  if (!roomCode) {
    return res.status(400).json({ error: 'roomCode is required' });
  }
  const state = {
    roomCode,
    nodes: nodes || [],
    connections: connections || [],
    savedAt: Date.now()
  };
  const filePath = getSaveFilePath(roomCode);
  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    res.json({ success: true, savedAt: state.savedAt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.get('/api/load/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode;
  const filePath = getSaveFilePath(roomCode);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Room state not found' });
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const state = JSON.parse(data);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load' });
  }
});

wss.on('connection', (ws: WebSocket) => {
  const userId = uuidv4();

  ws.on('message', (raw: Buffer) => {
    let data: any;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (data.type) {
      case 'join': {
        let roomCode = data.roomCode;
        if (!roomCode) break;

        const existingRoom = roomManager.rooms.get(roomCode);
        if (!existingRoom) {
          roomCode = roomManager.createRoomWithCode(roomCode);
        }

        const success = roomManager.joinRoom(roomCode, userId, data.userName, ws);
        if (success) {
          userRoomMap.set(userId, roomCode);
          roomManager.broadcastToRoom(
            roomCode,
            { type: 'user_joined', user: { id: userId, name: data.userName } },
            userId
          );
          const state = roomManager.getRoomState(roomCode);
          const users = roomManager.getRoomUsers(roomCode);
          ws.send(JSON.stringify({
            type: 'joined',
            roomCode,
            state,
            users
          }));
        } else {
          ws.send(JSON.stringify({ type: 'room_full' }));
        }
        break;
      }
      case 'add_node': {
        const rc = userRoomMap.get(userId);
        if (!rc) break;
        roomManager.updateNode(rc, data.node);
        roomManager.broadcastToRoom(rc, { type: 'add_node', node: data.node }, userId);
        break;
      }
      case 'move_node': {
        const rc = userRoomMap.get(userId);
        if (!rc) break;
        roomManager.moveNode(rc, data.nodeId, data.x, data.y);
        roomManager.broadcastToRoom(rc, { type: 'move_node', nodeId: data.nodeId, x: data.x, y: data.y }, userId);
        break;
      }
      case 'update_params': {
        const rc = userRoomMap.get(userId);
        if (!rc) break;
        roomManager.updateNodeParams(rc, data.nodeId, data.params, data.editorName);
        roomManager.broadcastToRoom(rc, { type: 'update_params', nodeId: data.nodeId, params: data.params, editorName: data.editorName }, userId);
        break;
      }
      case 'add_connection': {
        const rc = userRoomMap.get(userId);
        if (!rc) break;
        roomManager.addConnection(rc, data.connection);
        roomManager.broadcastToRoom(rc, { type: 'add_connection', connection: data.connection }, userId);
        break;
      }
      case 'remove_node': {
        const rc = userRoomMap.get(userId);
        if (!rc) break;
        roomManager.removeNode(rc, data.nodeId);
        roomManager.broadcastToRoom(rc, { type: 'remove_node', nodeId: data.nodeId }, userId);
        break;
      }
      case 'remove_connection': {
        const rc = userRoomMap.get(userId);
        if (!rc) break;
        roomManager.removeConnection(rc, data.connectionId);
        roomManager.broadcastToRoom(rc, { type: 'remove_connection', connectionId: data.connectionId }, userId);
        break;
      }
      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }
    }
  });

  ws.on('close', () => {
    const roomCode = userRoomMap.get(userId);
    if (roomCode) {
      roomManager.leaveRoom(roomCode, userId);
      userRoomMap.delete(userId);
      roomManager.broadcastToRoom(roomCode, {
        type: 'user_left',
        userId
      });
    }
  });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
  console.log(`Data directory: ${DATA_DIR}`);
});
