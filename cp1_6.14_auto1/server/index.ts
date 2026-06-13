import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import type { Shape, StickyNote, User, RoomState } from '../src/types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const rooms: Map<string, RoomState> = new Map();
const roomTimers: Map<string, NodeJS.Timeout> = new Map();

const ROOM_CLEANUP_DELAY = 5 * 60 * 1000;

const userColors = [
  '#89b4fa',
  '#f38ba8',
  '#a6e3a1',
  '#f9e2af',
  '#cba6f7',
  '#fab387',
  '#94e2d5',
  '#f5c2e7',
];

function scheduleRoomCleanup(roomId: string): void {
  clearRoomCleanup(roomId);
  const timer = setTimeout(() => {
    const room = rooms.get(roomId);
    if (room && room.users.length === 0) {
      rooms.delete(roomId);
      roomTimers.delete(roomId);
      console.log(`Room ${roomId} cleaned up due to inactivity`);
    }
  }, ROOM_CLEANUP_DELAY);
  roomTimers.set(roomId, timer);
}

function clearRoomCleanup(roomId: string): void {
  const timer = roomTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    roomTimers.delete(roomId);
  }
}

function getNextColor(roomId: string): string {
  const room = rooms.get(roomId);
  if (!room) return userColors[0];
  const usedColors = room.users.map((u) => u.color);
  for (const color of userColors) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  return userColors[Math.floor(Math.random() * userColors.length)];
}

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      shapes: [],
      stickyNotes: [],
      users: [],
    };
    rooms.set(roomId, room);
  }
  clearRoomCleanup(roomId);
  return room;
}

function tryCleanupRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (room && room.users.length === 0) {
    scheduleRoomCleanup(roomId);
  }
}

app.get('/api/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = rooms.get(roomId);
  if (!room) {
    res.json({ shapes: [], stickyNotes: [], users: [] });
  } else {
    res.json(room);
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    roomsCount: rooms.size,
    rooms: Array.from(rooms.keys()).map((id) => ({
      id,
      users: rooms.get(id)?.users.length ?? 0,
      shapes: rooms.get(id)?.shapes.length ?? 0,
      stickies: rooms.get(id)?.stickyNotes.length ?? 0,
    })),
  });
});

io.on('connection', (socket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  socket.on('room:join', ({ roomId, userName }: { roomId: string; userName: string }) => {
    currentRoomId = roomId;
    const room = getOrCreateRoom(roomId);

    const color = getNextColor(roomId);
    currentUserId = uuidv4();

    const user: User = {
      id: currentUserId,
      color,
      name: userName || '匿名用户',
    };

    room.users.push(user);
    socket.join(roomId);

    socket.emit('room:state', room);
    socket.emit('user:self', user);
    socket.to(roomId).emit('user:join', user);
  });

  socket.on('shape:add', (shape: Shape) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    room.shapes.push(shape);
    socket.to(currentRoomId).emit('shape:add', shape);
  });

  socket.on('shape:update', (shape: Shape) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const index = room.shapes.findIndex((s) => s.id === shape.id);
    if (index !== -1) {
      room.shapes[index] = shape;
      socket.to(currentRoomId).emit('shape:update', shape);
    }
  });

  socket.on('shape:delete', (shapeId: string) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const index = room.shapes.findIndex((s) => s.id === shapeId);
    if (index !== -1) {
      room.shapes.splice(index, 1);
      socket.to(currentRoomId).emit('shape:delete', shapeId);
    }
  });

  socket.on('sticky:add', (sticky: StickyNote) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    room.stickyNotes.push(sticky);
    socket.to(currentRoomId).emit('sticky:add', sticky);
  });

  socket.on('sticky:update', (sticky: StickyNote) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const index = room.stickyNotes.findIndex((s) => s.id === sticky.id);
    if (index !== -1) {
      room.stickyNotes[index] = sticky;
      socket.to(currentRoomId).emit('sticky:update', sticky);
    }
  });

  socket.on('sticky:delete', (stickyId: string) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const index = room.stickyNotes.findIndex((s) => s.id === stickyId);
    if (index !== -1) {
      room.stickyNotes.splice(index, 1);
      socket.to(currentRoomId).emit('sticky:delete', stickyId);
    }
  });

  socket.on('disconnect', () => {
    if (!currentRoomId || !currentUserId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const userIndex = room.users.findIndex((u) => u.id === currentUserId);
    if (userIndex !== -1) {
      room.users.splice(userIndex, 1);
      socket.to(currentRoomId).emit('user:leave', currentUserId);
    }

    tryCleanupRoom(currentRoomId);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, cleaning up...');
  roomTimers.forEach((timer) => clearTimeout(timer));
  roomTimers.clear();
  rooms.clear();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
