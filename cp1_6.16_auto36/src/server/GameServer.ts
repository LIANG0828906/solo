import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import roomManager from './RoomManager';
import type { ClientMessage, ServerMessage } from '../client/types';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

interface WSConnection {
  ws: WebSocket;
  roomId: string | null;
  clientId: string;
  role: 'player' | 'observer' | null;
  playerId?: string;
}

const connections: Map<string, WSConnection> = new Map();

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/rooms', (req: Request, res: Response) => {
  const rooms = roomManager.getPublishedRooms();
  res.json({ rooms });
});

app.post('/api/rooms', (req: Request, res: Response) => {
  try {
    const { layout, name } = req.body;
    if (!layout || !name) {
      return res.status(400).json({ error: 'Missing layout or name' });
    }
    const result = roomManager.createRoom(layout, name);
    console.log(`[Server] Room created: ${result.roomId} - ${name}`);
    res.json(result);
  } catch (e) {
    console.error('[Server] Create room error:', e);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    id: room.id,
    name: room.name,
    layout: room.layout,
    published: room.published,
  });
});

app.get('/api/rooms/:roomId/leaderboard', (req: Request, res: Response) => {
  const { nickname } = req.query;
  const result = roomManager.getLeaderboard(req.params.roomId, nickname as string);
  res.json(result);
});

app.post('/api/rooms/:roomId/score', (req: Request, res: Response) => {
  try {
    const { nickname, time } = req.body;
    if (!nickname || time == null) {
      return res.status(400).json({ error: 'Missing nickname or time' });
    }
    const result = roomManager.submitScore(req.params.roomId, nickname, time);
    if (!result.success) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.response);
  } catch (e) {
    console.error('[Server] Submit score error:', e);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

app.get('/api/rooms/:roomId/versions', (req: Request, res: Response) => {
  const versions = roomManager.getVersions(req.params.roomId);
  res.json({ versions });
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  const clientId = uuidv4();
  const conn: WSConnection = {
    ws,
    roomId: null,
    clientId,
    role: null,
  };
  connections.set(clientId, conn);

  console.log(`[WS] Client connected: ${clientId}`);

  ws.on('message', (data) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      handleMessage(conn, message);
    } catch (e) {
      console.error('[WS] Parse error:', e);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${clientId}`);
    handleDisconnect(conn);
    connections.delete(clientId);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error for client ${clientId}:`, err);
  });
});

function handleMessage(conn: WSConnection, message: ClientMessage) {
  switch (message.type) {
    case 'join_room':
      handleJoinRoom(conn, message);
      break;
    case 'player_move':
      handlePlayerMove(conn, message);
      break;
    case 'player_interact':
      handlePlayerInteract(conn, message);
      break;
    case 'leave_room':
      handleLeaveRoom(conn);
      break;
  }
}

function handleJoinRoom(conn: WSConnection, message: Extract<ClientMessage, { type: 'join_room' }>) {
  const { roomId, nickname, role } = message;
  const room = roomManager.getRoom(roomId);

  if (!room) {
    send(conn, { type: 'puzzle_failed', reason: 'Room not found' } as any);
    return;
  }

  conn.roomId = roomId;
  conn.role = role;

  if (role === 'player' && nickname) {
    const playerId = uuidv4();
    conn.playerId = playerId;
    const player = roomManager.addPlayer(roomId, playerId, nickname);

    if (player) {
      console.log(`[WS] Player joined: ${nickname} (${playerId}) in room ${roomId}`);

      send(conn, {
        type: 'room_state',
        layout: room.layout,
        players: Array.from(room.players.values()),
        exitUnlocked: false,
      });

      broadcast(roomId, {
        type: 'player_joined',
        player,
      }, conn.clientId);
    }
  } else if (role === 'observer') {
    roomManager.addObserver(roomId, conn.clientId);
    console.log(`[WS] Observer joined room ${roomId}`);

    send(conn, {
      type: 'room_state',
      layout: room.layout,
      players: Array.from(room.players.values()),
      exitUnlocked: false,
    });
  }
}

function handlePlayerMove(conn: WSConnection, message: Extract<ClientMessage, { type: 'player_move' }>) {
  if (!conn.roomId || !conn.playerId || conn.role !== 'player') return;

  const success = roomManager.updatePlayerPosition(conn.roomId, conn.playerId, message.x, message.y);
  if (success) {
    broadcast(conn.roomId, {
      type: 'player_moved',
      playerId: conn.playerId,
      x: message.x,
      y: message.y,
    });
  }
}

function handlePlayerInteract(conn: WSConnection, message: Extract<ClientMessage, { type: 'player_interact' }>) {
  if (!conn.roomId || !conn.playerId) return;

  const result = roomManager.handleInteraction(
    conn.roomId,
    conn.playerId,
    message.elementId,
    message.action,
    message.payload
  );

  if (result.success) {
    if (result.response) {
      send(conn, result.response);
    }
    if (result.broadcast) {
      broadcast(conn.roomId, result.broadcast);
    }

    broadcast(conn.roomId, {
      type: 'player_interacted',
      playerId: conn.playerId,
      elementId: message.elementId,
      action: message.action,
    });
  }
}

function handleLeaveRoom(conn: WSConnection) {
  handleDisconnect(conn);
  conn.roomId = null;
  conn.role = null;
  conn.playerId = undefined;
}

function handleDisconnect(conn: WSConnection) {
  if (conn.roomId && conn.playerId) {
    roomManager.removePlayer(conn.roomId, conn.playerId);
    broadcast(conn.roomId, {
      type: 'player_left',
      playerId: conn.playerId,
    });
    console.log(`[WS] Player left: ${conn.playerId} from room ${conn.roomId}`);
  }
}

function send(conn: WSConnection, message: ServerMessage) {
  if (conn.ws.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify(message));
  }
}

function broadcast(roomId: string, message: ServerMessage, excludeClientId?: string) {
  const data = JSON.stringify(message);
  for (const conn of connections.values()) {
    if (conn.roomId === roomId && conn.clientId !== excludeClientId) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(data);
      }
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('  暗夜密室 - 逃脱谜题编辑器 服务器');
  console.log('========================================');
  console.log(`HTTP 端口: ${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
  console.log('========================================');
  console.log(`演示密室 ID: demo`);
  console.log(`前端地址: http://localhost:5173`);
  console.log('========================================');
});

export default server;
