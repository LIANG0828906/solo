import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import { RoomState, Track, User, Effects, WSMessage } from './types';
import { generateInitialWaveData, mixAndExport } from './audioEngine';

const PORT = 3001;
const MAX_USERS_PER_ROOM = 4;

interface Room {
  state: RoomState;
  clients: Map<string, WebSocket>;
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/' });

const rooms = new Map<string, Room>();

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function createInitialTracks(): Track[] {
  return [
    {
      id: generateId(),
      name: '鼓组',
      type: 'drum',
      volume: 80,
      muted: false,
      waveData: generateInitialWaveData('drum'),
      order: 0,
    },
    {
      id: generateId(),
      name: '贝斯',
      type: 'bass',
      volume: 75,
      muted: false,
      waveData: generateInitialWaveData('bass'),
      order: 1,
    },
    {
      id: generateId(),
      name: '吉他',
      type: 'guitar',
      volume: 70,
      muted: false,
      waveData: generateInitialWaveData('guitar'),
      order: 2,
    },
  ];
}

function createRoom(roomId: string, hostId: string, hostNickname: string): Room {
  const host: User = {
    id: hostId,
    nickname: hostNickname,
    isHost: true,
  };

  const state: RoomState = {
    roomId,
    users: [host],
    tracks: createInitialTracks(),
    masterVolume: 85,
    effects: {
      reverb: 25,
      compression: 40,
      delay: 15,
    },
    isPlaying: false,
    hostId,
  };

  return {
    state,
    clients: new Map(),
  };
}

function broadcast(room: Room, message: WSMessage, excludeUserId?: string) {
  const data = JSON.stringify(message);
  room.clients.forEach((ws, userId) => {
    if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function sendToClient(ws: WebSocket, message: WSMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function handleJoin(ws: WebSocket, roomId: string, nickname: string) {
  const userId = generateId();
  let room = rooms.get(roomId);

  if (!room) {
    room = createRoom(roomId, userId, nickname);
    rooms.set(roomId, room);
  } else {
    if (room.state.users.length >= MAX_USERS_PER_ROOM) {
      sendToClient(ws, { type: 'room_full' });
      ws.close();
      return;
    }

    const newUser: User = {
      id: userId,
      nickname,
      isHost: false,
    };
    room.state.users.push(newUser);

    room.clients.forEach((clientWs) => {
      sendToClient(clientWs, {
        type: 'state_update',
        state: { users: room!.state.users },
      });
    });
  }

  room.clients.set(userId, ws);

  const user = room.state.users.find((u) => u.id === userId)!;
  sendToClient(ws, {
    type: 'joined',
    state: JSON.parse(JSON.stringify(room.state)),
    userId,
  });

  ws.on('message', (rawData) => {
    try {
      const msg: WSMessage = JSON.parse(rawData.toString());
      handleMessage(userId, roomId, msg);
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });

  ws.on('close', () => {
    handleDisconnect(userId, roomId);
  });

  ws.on('error', () => {
    handleDisconnect(userId, roomId);
  });
}

function handleMessage(userId: string, roomId: string, msg: WSMessage) {
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.state.users.find((u) => u.id === userId);
  if (!user) return;

  switch (msg.type) {
    case 'track_update': {
      const trackIndex = room.state.tracks.findIndex((t) => t.id === msg.track.id);
      if (trackIndex !== -1) {
        room.state.tracks[trackIndex] = msg.track;
        broadcast(room, msg, userId);
      }
      break;
    }

    case 'track_delete': {
      if (!user.isHost) return;
      room.state.tracks = room.state.tracks.filter((t) => t.id !== msg.trackId);
      broadcast(room, msg, userId);
      break;
    }

    case 'track_reorder': {
      const idOrder = msg.trackIds;
      room.state.tracks.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));
      room.state.tracks.forEach((t, i) => (t.order = i));
      broadcast(room, msg, userId);
      break;
    }

    case 'effects_update': {
      room.state.effects = msg.effects;
      broadcast(room, msg, userId);
      break;
    }

    case 'master_volume': {
      room.state.masterVolume = msg.volume;
      broadcast(room, msg, userId);
      break;
    }

    case 'playback': {
      room.state.isPlaying = msg.isPlaying;
      broadcast(room, msg, userId);
      break;
    }

    case 'export_request': {
      if (!user.isHost) {
        const ws = room.clients.get(userId);
        if (ws) {
          sendToClient(ws, { type: 'error', message: '仅房主可导出' });
        }
        return;
      }

      const ws = room.clients.get(userId);
      if (!ws) return;

      mixAndExport(
        JSON.parse(JSON.stringify(room.state.tracks)),
        JSON.parse(JSON.stringify(room.state.effects)),
        room.state.masterVolume
      )
        .then((blobUrl) => {
          sendToClient(ws, { type: 'export_complete', blobUrl });
        })
        .catch((err) => {
          console.error('Export error:', err);
          sendToClient(ws, { type: 'error', message: '导出失败，请重试' });
        });
      break;
    }
  }
}

function handleDisconnect(userId: string, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.clients.delete(userId);

  const leavingUser = room.state.users.find((u) => u.id === userId);
  room.state.users = room.state.users.filter((u) => u.id !== userId);

  if (room.state.users.length === 0) {
    setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (currentRoom && currentRoom.state.users.length === 0) {
        rooms.delete(roomId);
      }
    }, 60000);
    return;
  }

  if (leavingUser?.isHost) {
    const newHost = room.state.users[0];
    newHost.isHost = true;
    room.state.hostId = newHost.id;
  }

  room.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'state_update',
          state: {
            users: room.state.users,
            hostId: room.state.hostId,
          },
        })
      );
    }
  });
}

wss.on('connection', (ws) => {
  ws.once('message', (rawData) => {
    try {
      const msg: WSMessage = JSON.parse(rawData.toString());
      if (msg.type === 'join') {
        handleJoin(ws, msg.roomId, msg.nickname);
      } else {
        sendToClient(ws, { type: 'error', message: '请先加入房间' });
        ws.close();
      }
    } catch (e) {
      console.error('Initial message error:', e);
      ws.close();
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    totalUsers: Array.from(rooms.values()).reduce((sum, r) => sum + r.state.users.length, 0),
  });
});

server.listen(PORT, () => {
  console.log(`[Remote Studio] Server running on http://localhost:${PORT}`);
  console.log(`[Remote Studio] WebSocket ready on ws://localhost:${PORT}`);
  console.log(`[Remote Studio] Health check: http://localhost:${PORT}/health`);
});
