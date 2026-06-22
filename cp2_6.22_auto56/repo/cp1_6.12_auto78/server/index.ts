import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { documentManager } from './documentManager';
import { User, LyricLine, TextOperation, Timestamp } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
});

interface RoomInfo {
  users: User[];
  timestamps: Map<string, Timestamp>;
  cursors: Map<string, { lineIndex: number; charIndex: number; user: User }>;
}

const rooms: Map<string, RoomInfo> = new Map();

app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    timestamp: Date.now(),
  });
});

const getOrCreateRoom = (roomId: string): RoomInfo => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: [],
      timestamps: new Map(),
      cursors: new Map(),
    });
    documentManager.getOrCreate(roomId);
  }
  return rooms.get(roomId)!;
};

const broadcastUserList = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('user-joined', [...room.users]);
};

const broadcastCursors = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const cursorMap: Record<string, { lineIndex: number; charIndex: number; user: User }> = {};
  room.cursors.forEach((value, key) => {
    cursorMap[key] = value;
  });
  io.to(roomId).emit('cursor-update-broadcast', cursorMap);
};

const syncTimestampsToLines = (roomId: string): LyricLine[] => {
  const room = rooms.get(roomId);
  const lines = documentManager.getLines(roomId);
  if (!room) return lines;

  lines.forEach((line, idx) => {
    line.timestamp = undefined;
  });

  room.timestamps.forEach((ts) => {
    if (lines[ts.lineIndex]) {
      lines[ts.lineIndex].timestamp = ts;
    }
  });

  return lines;
};

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  socket.on('join-room', ({ roomId, user }: { roomId: string; user: User }) => {
    if (!roomId || !user) {
      socket.emit('error', { message: 'Invalid join data' });
      return;
    }

    currentRoomId = roomId;
    currentUserId = user.id;
    user.socketId = socket.id;

    const room = getOrCreateRoom(roomId);

    const existingIndex = room.users.findIndex((u) => u.id === user.id);
    if (existingIndex >= 0) {
      room.users[existingIndex] = user;
    } else {
      room.users.push(user);
    }

    socket.join(roomId);

    const lines = syncTimestampsToLines(roomId);
    const version = documentManager.getVersion(roomId);

    socket.emit('room-joined', {
      lines,
      users: [...room.users],
      version,
    });

    broadcastUserList(roomId);
    broadcastCursors(roomId);

    console.log(`[Room] ${user.nickname} (${user.id}) joined ${roomId}. Total: ${room.users.length}`);
  });

  socket.on('leave-room', ({ roomId, userId }: { roomId: string; userId: string }) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const wasInRoom = room.users.find((u) => u.id === userId);
    if (wasInRoom) {
      room.users = room.users.filter((u) => u.id !== userId);
      room.cursors.delete(userId);
      socket.leave(roomId);

      console.log(`[Room] ${wasInRoom.nickname} left ${roomId}. Remaining: ${room.users.length}`);

      if (room.users.length === 0) {
        rooms.delete(roomId);
        documentManager.clear(roomId);
        console.log(`[Room] ${roomId} destroyed (empty)`);
      } else {
        broadcastUserList(roomId);
        broadcastCursors(roomId);
      }
    }
  });

  socket.on('text-operation', ({ roomId, operation }: { roomId: string; operation: TextOperation }) => {
    if (!roomId || !operation) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const result = documentManager.applyOperation(roomId, operation);
    if (!result.success) return;

    socket.to(roomId).emit('text-operation', operation);
  });

  socket.on(
    'cursor-update',
    ({
      roomId,
      userId,
      position,
    }: {
      roomId: string;
      userId: string;
      position: { lineIndex: number; charIndex: number };
    }) => {
      if (!roomId || !userId || !position) return;
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.id === userId);
      if (user) {
        room.cursors.set(userId, { ...position, user });
      }
      broadcastCursors(roomId);
    }
  );

  socket.on('timestamp-add', ({ roomId, timestamp }: { roomId: string; timestamp: Timestamp }) => {
    if (!roomId || !timestamp) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (timestamp.lineIndex >= 0) {
      room.timestamps.set(timestamp.id, timestamp);
      io.to(roomId).emit('timestamp-added', timestamp);
    }
  });

  socket.on('timestamp-update', ({ roomId, timestamp }: { roomId: string; timestamp: Timestamp }) => {
    if (!roomId || !timestamp) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.timestamps.has(timestamp.id)) {
      room.timestamps.set(timestamp.id, timestamp);
      io.to(roomId).emit('timestamp-updated', timestamp);
    }
  });

  socket.on(
    'timestamp-remove',
    ({ roomId, timestampId, lineIndex }: { roomId: string; timestampId: string; lineIndex: number }) => {
      if (!roomId || !timestampId) return;
      const room = rooms.get(roomId);
      if (!room) return;

      if (room.timestamps.has(timestampId)) {
        room.timestamps.delete(timestampId);
        io.to(roomId).emit('timestamp-removed', { timestampId, lineIndex });
      }
    }
  );

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);

    if (currentRoomId && currentUserId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const wasInRoom = room.users.find((u) => u.id === currentUserId);
        if (wasInRoom) {
          room.users = room.users.filter((u) => u.id !== currentUserId);
          room.cursors.delete(currentUserId);

          console.log(`[Room] ${wasInRoom.nickname} disconnected from ${currentRoomId}. Remaining: ${room.users.length}`);

          if (room.users.length === 0) {
            rooms.delete(currentRoomId);
            documentManager.clear(currentRoomId);
            console.log(`[Room] ${currentRoomId} destroyed (empty)`);
          } else {
            broadcastUserList(currentRoomId);
            broadcastCursors(currentRoomId);
          }
        }
      }
    }
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

httpServer.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  🎵 实时歌词同步编辑器服务器`);
  console.log(`========================================`);
  console.log(`  WebSocket Server : http://localhost:${PORT}`);
  console.log(`  Socket.IO Path   : /socket.io`);
  console.log(`  Health Check     : http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
});
