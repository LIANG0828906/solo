import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createRoom,
  getRoom,
  addUser,
  removeUser,
  getUsers,
  updateNodes,
  updateNodePosition,
  updateNodeContent,
  type User,
  type MindMapNode,
} from './roomManager.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(express.json());

app.post('/api/rooms', (_req, res) => {
  const room = createRoom();
  res.json({ code: room.code });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json(room);
});

io.on('connection', (socket) => {
  let currentUser: User | null = null;

  socket.on('join-room', (data: { roomCode: string; userName: string }) => {
    const { roomCode, userName } = data;
    const room = getRoom(roomCode);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const user: User = {
      id: uuidv4(),
      name: userName,
      socketId: socket.id,
      roomCode,
    };

    addUser(roomCode, user);
    currentUser = user;

    socket.join(roomCode);

    socket.emit('room-joined', {
      user,
      room,
    });

    const users = getUsers(roomCode) || [];
    socket.to(roomCode).emit('user-joined', { user, users });
  });

  socket.on('nodes-update', (data: { roomCode: string; nodes: Record<string, MindMapNode> }) => {
    const { roomCode, nodes } = data;
    updateNodes(roomCode, nodes);
    socket.to(roomCode).emit('nodes-updated', { nodes });
  });

  socket.on('node-drag', (data: { roomCode: string; nodeId: string; x: number; y: number }) => {
    const { roomCode, nodeId, x, y } = data;
    updateNodePosition(roomCode, nodeId, x, y);
    socket.to(roomCode).emit('node-dragged', { nodeId, x, y });
  });

  socket.on(
    'node-edit',
    (data: { roomCode: string; nodeId: string; text?: string; note?: string; icon?: string }) => {
      const { roomCode, nodeId, text, note, icon } = data;
      updateNodeContent(roomCode, nodeId, text, note, icon);
      socket.to(roomCode).emit('node-edited', { nodeId, text, note, icon });
    }
  );

  socket.on('disconnect', () => {
    if (!currentUser) return;

    const { roomCode, id: userId } = currentUser;
    removeUser(roomCode, userId);

    const users = getUsers(roomCode) || [];
    socket.to(roomCode).emit('user-left', { userId, users });
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
