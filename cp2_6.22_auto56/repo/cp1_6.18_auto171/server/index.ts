import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getOrCreateRoom,
  addUserToRoom,
  removeUserFromRoom,
  addElementToRoom,
  updateElementInRoom,
  deleteElementFromRoom,
  clearRoom,
  createSnapshot,
  rollbackToSnapshot,
  getRoomState,
  shouldCreateSnapshot,
  getAllRoomIds,
} from './roomManager.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use((await import('cors')).default());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ok' });
});

app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  res.json({
    roomId: room.roomId,
    elementCount: room.elements.length,
    userCount: room.users.size,
    snapshotCount: room.snapshots.length,
  });
});

app.post('/api/room', (_req, res) => {
  const roomId = uuidv4();
  getOrCreateRoom(roomId);
  res.json({ roomId });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

io.on('connection', (socket) => {
  const userId = uuidv4();
  socket.data.userId = userId;
  let currentRoomId: string | null = null;

  socket.on('room:join', (roomId: string) => {
    currentRoomId = roomId;
    addUserToRoom(roomId, userId);
    const room = getOrCreateRoom(roomId);
    socket.join(roomId);
    const state = getRoomState(roomId);
    socket.emit('room:state', state);
    socket.to(roomId).emit('room:user:join', { userId });
  });

  socket.on('room:element:add', (element) => {
    if (!currentRoomId) return;
    addElementToRoom(currentRoomId, element);
    socket.to(currentRoomId).emit('room:element:add', element);
  });

  socket.on('room:element:update', (element) => {
    if (!currentRoomId) return;
    updateElementInRoom(currentRoomId, element);
    socket.to(currentRoomId).emit('room:element:update', element);
  });

  socket.on('room:element:delete', (elementId: string) => {
    if (!currentRoomId) return;
    deleteElementFromRoom(currentRoomId, elementId);
    socket.to(currentRoomId).emit('room:element:delete', elementId);
  });

  socket.on('room:clear', () => {
    if (!currentRoomId) return;
    clearRoom(currentRoomId);
    socket.to(currentRoomId).emit('room:clear');
  });

  socket.on('room:rollback', (snapshotId: string) => {
    if (!currentRoomId) return;
    const result = rollbackToSnapshot(currentRoomId, snapshotId);
    if (result) {
      io.to(currentRoomId).emit('room:rollback', result);
    }
  });

  socket.on('disconnect', () => {
    if (currentRoomId) {
      removeUserFromRoom(currentRoomId, userId);
      socket.to(currentRoomId).emit('room:user:leave', { userId });
    }
  });
});

setInterval(() => {
  const roomIds = getAllRoomIds();
  for (const roomId of roomIds) {
    if (shouldCreateSnapshot(roomId)) {
      const snapshot = createSnapshot(roomId);
      io.to(roomId).emit('room:snapshot', snapshot);
    }
  }
}, 30 * 1000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
