import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { DrawPath, User, RoomState, TextItem } from './shared/types.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, RoomState>();
const snapshotInterval = 10000;

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      users: [],
      snapshot: null,
      lastSnapshotTime: 0,
    };
    rooms.set(roomId, room);
  }
  return room;
}

io.on('connection', (socket) => {
  let currentUser: User | null = null;

  socket.on('room:join', ({ roomId, userName }, callback) => {
    const room = getOrCreateRoom(roomId);

    currentUser = {
      id: socket.id,
      name: userName,
      roomId,
      socketId: socket.id,
    };

    room.users.push(currentUser);
    socket.join(roomId);

    if (room.snapshot) {
      socket.emit('canvas:snapshot', room.snapshot);
    }

    io.to(roomId).emit('room:users', room.users);
    if (callback) {
      callback(room.users);
    }
  });

  socket.on('draw:path', (path: DrawPath) => {
    if (!currentUser) return;
    socket.to(currentUser.roomId).emit('draw:path', path);
  });

  socket.on('text:add', (text: TextItem) => {
    if (!currentUser) return;
    socket.to(currentUser.roomId).emit('text:add', text);
  });

  socket.on('text:move', (data: { id: string; x: number; y: number }) => {
    if (!currentUser) return;
    socket.to(currentUser.roomId).emit('text:move', data);
  });

  socket.on('text:delete', (id: string) => {
    if (!currentUser) return;
    socket.to(currentUser.roomId).emit('text:delete', id);
  });

  socket.on('canvas:clear', () => {
    if (!currentUser) return;
    socket.to(currentUser.roomId).emit('canvas:clear');
    const room = rooms.get(currentUser.roomId);
    if (room) {
      room.snapshot = null;
    }
  });

  socket.on('canvas:saveSnapshot', (dataUrl: string) => {
    if (!currentUser) return;
    const room = rooms.get(currentUser.roomId);
    if (room) {
      room.snapshot = dataUrl;
      room.lastSnapshotTime = Date.now();
      socket.emit('snapshot:saved', room.lastSnapshotTime);
    }
  });

  socket.on('room:leave', () => {
    if (!currentUser) return;
    const room = rooms.get(currentUser.roomId);
    if (room) {
      room.users = room.users.filter((u) => u.id !== currentUser!.id);
      io.to(currentUser.roomId).emit('room:users', room.users);
    }
    socket.leave(currentUser.roomId);
    currentUser = null;
  });

  socket.on('disconnect', () => {
    if (!currentUser) return;
    const room = rooms.get(currentUser.roomId);
    if (room) {
      room.users = room.users.filter((u) => u.id !== currentUser!.id);
      io.to(currentUser.roomId).emit('room:users', room.users);
    }
  });
});

setInterval(() => {
  rooms.forEach((room) => {
    if (room.users.length > 0) {
      const firstUserSocket = room.users[0]?.socketId;
      if (firstUserSocket) {
        io.to(firstUserSocket).emit('canvas:requestSnapshot');
      }
    }
  });
}, snapshotInterval);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Snapshot interval: ${snapshotInterval}ms`);
});
