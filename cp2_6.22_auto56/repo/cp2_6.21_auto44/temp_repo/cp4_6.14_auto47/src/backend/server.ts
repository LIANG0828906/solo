import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { roomManager } from './roomManager';
import { Layer } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

interface UploadedAsset {
  id: string;
  dataUrl: string;
  name: string;
}

const assets: Map<string, UploadedAsset> = new Map();

app.post('/api/upload', (req, res) => {
  try {
    const { dataUrl, name } = req.body;
    const id = uuidv4();
    assets.set(id, { id, dataUrl, name });
    res.json({ id, url: dataUrl, name });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/assets/:id', (req, res) => {
  const asset = assets.get(req.params.id);
  if (!asset) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }
  res.json(asset);
});

app.get('/api/rooms/:roomId', (req, res) => {
  const state = roomManager.getRoomState(req.params.roomId);
  res.json(state);
});

io.on('connection', (socket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  socket.on('join-room', (roomId: string, userName: string) => {
    currentRoomId = roomId;
    const { user, state } = roomManager.addUser(roomId, userName);
    currentUserId = user.id;
    socket.join(roomId);
    socket.emit('current-user', user);
    socket.emit('room-state', state);
    socket.to(roomId).emit('user-joined', user);
    socket.to(roomId).emit('users-update', roomManager.getUsers(roomId));
  });

  socket.on('cursor-move', (x: number, y: number) => {
    if (!currentRoomId || !currentUserId) return;
    const user = roomManager.updateCursor(currentRoomId, currentUserId, x, y);
    if (user) {
      socket.to(currentRoomId).emit('cursor-update', user);
    }
  });

  socket.on('add-layer', (layer: Layer) => {
    if (!currentRoomId) return;
    const state = roomManager.addLayer(currentRoomId, layer);
    if (state) {
      io.to(currentRoomId).emit('layers-update', state.layers);
    }
  });

  socket.on('update-layer', (layerId: string, updates: Partial<Layer>) => {
    if (!currentRoomId) return;
    const state = roomManager.updateLayer(currentRoomId, layerId, updates);
    if (state) {
      socket.to(currentRoomId).emit('layers-update', state.layers);
    }
  });

  socket.on('delete-layer', (layerId: string) => {
    if (!currentRoomId) return;
    const state = roomManager.deleteLayer(currentRoomId, layerId);
    if (state) {
      io.to(currentRoomId).emit('layers-update', state.layers);
    }
  });

  socket.on('reorder-layer', (layerId: string, newIndex: number) => {
    if (!currentRoomId) return;
    const state = roomManager.reorderLayers(currentRoomId, layerId, newIndex);
    if (state) {
      io.to(currentRoomId).emit('layers-update', state.layers);
    }
  });

  socket.on('disconnect', () => {
    if (currentRoomId && currentUserId) {
      roomManager.removeUser(currentRoomId, currentUserId);
      socket.to(currentRoomId).emit('user-left', currentUserId);
      socket
        .to(currentRoomId)
        .emit('users-update', roomManager.getUsers(currentRoomId));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
