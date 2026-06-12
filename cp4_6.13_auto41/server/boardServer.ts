import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  ensureRoom,
  getBoardState,
  addStroke,
  deleteStroke,
  addSticky,
  updateSticky,
  deleteSticky,
  addNode,
  updateNode,
  deleteNode,
  addChatMessage,
  getRecentChats,
  saveVersion,
  getVersions,
  getVersion,
  restoreVersion,
  getMaxZIndex,
  Stroke,
  Sticky,
  MindNode,
  ChatMessage,
  BoardSnapshot,
} from './database';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

interface RoomUser {
  socketId: string;
  userId: string;
  username: string;
  avatarColor: string;
}

const roomUsers = new Map<string, RoomUser[]>();

function getOnlineUsers(roomId: string): RoomUser[] {
  return roomUsers.get(roomId) || [];
}

function addUserToRoom(roomId: string, user: RoomUser): void {
  if (!roomUsers.has(roomId)) {
    roomUsers.set(roomId, []);
  }
  const users = roomUsers.get(roomId)!;
  const existingIndex = users.findIndex(u => u.userId === user.userId);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
}

function removeUserFromRoom(roomId: string, socketId: string): void {
  const users = roomUsers.get(roomId);
  if (!users) return;
  const index = users.findIndex(u => u.socketId === socketId);
  if (index >= 0) {
    users.splice(index, 1);
  }
  if (users.length === 0) {
    roomUsers.delete(roomId);
  }
}

function generateAvatarColor(): string {
  const colors = [
    '#E53E3E', '#DD6B20', '#D69E2E', '#38A169',
    '#319795', '#3182CE', '#5A67D8', '#805AD5',
    '#D53F8C', '#DB2777', '#0D9488', '#0891B2',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const autoSaveIntervals = new Map<string, NodeJS.Timeout>();

function startAutoSave(roomId: string): void {
  if (autoSaveIntervals.has(roomId)) return;
  
  const interval = setInterval(() => {
    try {
      const snapshot = getBoardState(roomId);
      const now = new Date();
      const label = `自动保存 ${now.toLocaleString('zh-CN')}`;
      saveVersion(roomId, snapshot, undefined, label);
      io.to(roomId).emit('version:new', { timestamp: Date.now(), label });
    } catch (e) {
      console.error('Auto save failed for room', roomId, e);
    }
  }, 5 * 60 * 1000);
  
  autoSaveIntervals.set(roomId, interval);
}

function stopAutoSave(roomId: string): void {
  const interval = autoSaveIntervals.get(roomId);
  if (interval) {
    clearInterval(interval);
    autoSaveIntervals.delete(roomId);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/rooms/:roomId/exists', (req, res) => {
  const { roomId } = req.params;
  try {
    ensureRoom(roomId);
    res.json({ exists: true, roomId });
  } catch (e) {
    res.status(500).json({ error: 'Failed to check room' });
  }
});

app.get('/api/rooms/:roomId/state', (req, res) => {
  const { roomId } = req.params;
  try {
    const state = getBoardState(roomId);
    res.json(state);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get board state' });
  }
});

app.get('/api/rooms/:roomId/chats', (req, res) => {
  const { roomId } = req.params;
  try {
    const chats = getRecentChats(roomId, 50);
    res.json(chats);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

app.get('/api/rooms/:roomId/versions', (req, res) => {
  const { roomId } = req.params;
  try {
    const versions = getVersions(roomId);
    res.json(versions);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get versions' });
  }
});

app.get('/api/rooms/:roomId/versions/:versionId', (req, res) => {
  const { roomId, versionId } = req.params;
  try {
    const version = getVersion(versionId, roomId);
    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    res.json(version);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get version' });
  }
});

app.post('/api/rooms/:roomId/versions/:versionId/restore', (req, res) => {
  const { roomId, versionId } = req.params;
  try {
    const snapshot = restoreVersion(roomId, versionId);
    if (!snapshot) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    io.to(roomId).emit('board:restore', snapshot);
    res.json({ success: true, snapshot });
  } catch (e) {
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

io.on('connection', (socket: Socket) => {
  let currentRoom: string | null = null;
  let currentUserId: string | null = null;
  let currentUsername: string | null = null;

  socket.on('room:join', ({ roomId, username, userId }: { roomId: string; username: string; userId?: string }) => {
    if (!roomId || !username) {
      socket.emit('error', { message: 'Room ID and username are required' });
      return;
    }

    try {
      ensureRoom(roomId);
      
      const uid = userId || uuidv4();
      const avatarColor = generateAvatarColor();
      
      socket.join(roomId);
      currentRoom = roomId;
      currentUserId = uid;
      currentUsername = username;
      
      addUserToRoom(roomId, {
        socketId: socket.id,
        userId: uid,
        username,
        avatarColor,
      });
      
      startAutoSave(roomId);
      
      const state = getBoardState(roomId);
      const chats = getRecentChats(roomId, 50);
      const onlineUsers = getOnlineUsers(roomId);
      
      socket.emit('room:joined', {
        userId: uid,
        avatarColor,
        boardState: state,
        chats,
        onlineUsers: onlineUsers.map(u => ({ userId: u.userId, username: u.username, avatarColor: u.avatarColor })),
      });
      
      socket.to(roomId).emit('user:joined', {
        userId: uid,
        username,
        avatarColor,
      });
    } catch (e) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('stroke:add', (strokeData: Omit<Stroke, 'created_at'>) => {
    if (!currentRoom) return;
    try {
      const maxZ = getMaxZIndex(currentRoom);
      const stroke = addStroke({ ...strokeData, room_id: currentRoom, z_index: maxZ + 1 });
      socket.to(currentRoom).emit('stroke:add', stroke);
    } catch (e) {
      console.error('Stroke add error:', e);
    }
  });

  socket.on('stroke:delete', ({ id }: { id: string }) => {
    if (!currentRoom) return;
    try {
      deleteStroke(id, currentRoom);
      socket.to(currentRoom).emit('stroke:delete', { id });
    } catch (e) {
      console.error('Stroke delete error:', e);
    }
  });

  socket.on('sticky:add', (stickyData: Omit<Sticky, 'created_at'>) => {
    if (!currentRoom) return;
    try {
      const maxZ = getMaxZIndex(currentRoom);
      const sticky = addSticky({ ...stickyData, room_id: currentRoom, z_index: maxZ + 1 });
      socket.to(currentRoom).emit('sticky:add', sticky);
    } catch (e) {
      console.error('Sticky add error:', e);
    }
  });

  socket.on('sticky:update', ({ id, updates }: { id: string; updates: Partial<Sticky> }) => {
    if (!currentRoom) return;
    try {
      updateSticky(id, currentRoom, updates);
      socket.to(currentRoom).emit('sticky:update', { id, updates });
    } catch (e) {
      console.error('Sticky update error:', e);
    }
  });

  socket.on('sticky:delete', ({ id }: { id: string }) => {
    if (!currentRoom) return;
    try {
      deleteSticky(id, currentRoom);
      socket.to(currentRoom).emit('sticky:delete', { id });
    } catch (e) {
      console.error('Sticky delete error:', e);
    }
  });

  socket.on('sticky:top', ({ id }: { id: string }) => {
    if (!currentRoom) return;
    try {
      const maxZ = getMaxZIndex(currentRoom);
      updateSticky(id, currentRoom, { z_index: maxZ + 1 });
      socket.to(currentRoom).emit('sticky:update', { id, updates: { z_index: maxZ + 1 } });
    } catch (e) {
      console.error('Sticky top error:', e);
    }
  });

  socket.on('node:add', (nodeData: Omit<MindNode, 'created_at'>) => {
    if (!currentRoom) return;
    try {
      const maxZ = getMaxZIndex(currentRoom);
      const node = addNode({ ...nodeData, room_id: currentRoom, z_index: maxZ + 1 });
      socket.to(currentRoom).emit('node:add', node);
    } catch (e) {
      console.error('Node add error:', e);
    }
  });

  socket.on('node:update', ({ id, updates }: { id: string; updates: Partial<MindNode> }) => {
    if (!currentRoom) return;
    try {
      updateNode(id, currentRoom, updates);
      socket.to(currentRoom).emit('node:update', { id, updates });
    } catch (e) {
      console.error('Node update error:', e);
    }
  });

  socket.on('node:delete', ({ id }: { id: string }) => {
    if (!currentRoom) return;
    try {
      deleteNode(id, currentRoom);
      socket.to(currentRoom).emit('node:delete', { id });
    } catch (e) {
      console.error('Node delete error:', e);
    }
  });

  socket.on('chat:send', ({ message }: { message: string }) => {
    if (!currentRoom || !currentUserId || !currentUsername) return;
    try {
      const user = getOnlineUsers(currentRoom).find(u => u.userId === currentUserId);
      const avatarColor = user?.avatarColor || '#3182CE';
      
      const chat = addChatMessage({
        room_id: currentRoom,
        user_id: currentUserId,
        username: currentUsername,
        avatar_color: avatarColor,
        message,
      });
      
      io.to(currentRoom).emit('chat:new', chat);
    } catch (e) {
      console.error('Chat send error:', e);
    }
  });

  socket.on('cursor:move', ({ x, y }: { x: number; y: number }) => {
    if (!currentRoom || !currentUserId) return;
    socket.to(currentRoom).emit('cursor:move', {
      userId: currentUserId,
      username: currentUsername,
      x,
      y,
    });
  });

  socket.on('disconnect', () => {
    if (currentRoom && currentUserId) {
      removeUserFromRoom(currentRoom, socket.id);
      const onlineUsers = getOnlineUsers(currentRoom);
      
      if (onlineUsers.length === 0) {
        stopAutoSave(currentRoom);
      } else {
        socket.to(currentRoom).emit('user:left', { userId: currentUserId });
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Whiteboard server running on port ${PORT}`);
});
