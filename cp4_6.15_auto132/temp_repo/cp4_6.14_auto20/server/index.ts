import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Score, Note, Collaborator, VersionSnapshot } from './types';

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

interface RoomState {
  score: Score;
  collaborators: Map<string, Collaborator>;
  versions: VersionSnapshot[];
  autoSaveTimer: NodeJS.Timeout | null;
  lastActivity: number;
}

const rooms = new Map<string, RoomState>();

const createDefaultScore = (scoreId: string): Score => ({
  id: scoreId,
  title: '未命名乐谱',
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  notes: [
    {
      id: uuidv4(),
      pitch: 0,
      octave: 5,
      duration: 1,
      position: 0,
      staff: 'treble'
    },
    {
      id: uuidv4(),
      pitch: 2,
      octave: 5,
      duration: 1,
      position: 1,
      staff: 'treble'
    },
    {
      id: uuidv4(),
      pitch: 4,
      octave: 5,
      duration: 1,
      position: 2,
      staff: 'treble'
    },
    {
      id: uuidv4(),
      pitch: 5,
      octave: 5,
      duration: 1,
      position: 3,
      staff: 'treble'
    },
    {
      id: uuidv4(),
      pitch: 7,
      octave: 5,
      duration: 1,
      position: 4,
      staff: 'treble'
    },
    {
      id: uuidv4(),
      pitch: 9,
      octave: 5,
      duration: 1,
      position: 5,
      staff: 'treble'
    },
    {
      id: uuidv4(),
      pitch: 11,
      octave: 5,
      duration: 1,
      position: 6,
      staff: 'treble'
    },
    {
      id: uuidv4(),
      pitch: 0,
      octave: 6,
      duration: 1,
      position: 7,
      staff: 'treble'
    }
  ],
  createdAt: Date.now(),
  updatedAt: Date.now()
});

const getOrCreateRoom = (roomId: string): RoomState => {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      score: createDefaultScore(roomId),
      collaborators: new Map(),
      versions: [],
      autoSaveTimer: null,
      lastActivity: Date.now()
    };
    rooms.set(roomId, room);

    const initialVersion: VersionSnapshot = {
      id: uuidv4(),
      scoreId: roomId,
      score: JSON.parse(JSON.stringify(room.score)),
      timestamp: Date.now(),
      author: '系统',
      message: '初始版本'
    };
    room.versions.push(initialVersion);
  }
  return room;
};

const broadcastCollaborators = (room: RoomState, roomId: string) => {
  const collabList = Array.from(room.collaborators.values());
  io.to(roomId).emit('collaborators-updated', collabList);
};

const scheduleAutoSave = (room: RoomState, roomId: string) => {
  if (room.autoSaveTimer) {
    clearTimeout(room.autoSaveTimer);
  }
  room.autoSaveTimer = setTimeout(() => {
    autoSaveVersion(room, roomId);
  }, 60000);
};

const autoSaveVersion = (room: RoomState, roomId: string) => {
  if (room.versions.length > 0) {
    const lastVersion = room.versions[0];
    const lastNotesStr = JSON.stringify(lastVersion.score.notes);
    const currentNotesStr = JSON.stringify(room.score.notes);
    if (lastNotesStr === currentNotesStr && lastVersion.score.title === room.score.title) {
      return;
    }
  }

  const version: VersionSnapshot = {
    id: uuidv4(),
    scoreId: roomId,
    score: JSON.parse(JSON.stringify(room.score)),
    timestamp: Date.now(),
    author: '自动保存',
    message: '自动保存快照'
  };

  room.versions.unshift(version);
  if (room.versions.length > 50) {
    room.versions.pop();
  }

  io.to(roomId).emit('version-created', version);
};

io.on('connection', (socket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  socket.on('join-room', ({ roomId, userId, userName, userColor }) => {
    currentRoomId = roomId;
    currentUserId = userId;

    const room = getOrCreateRoom(roomId);

    const collaborator: Collaborator = {
      id: userId,
      name: userName,
      color: userColor,
      cursorPosition: null
    };
    room.collaborators.set(userId, collaborator);

    socket.join(roomId);
    room.lastActivity = Date.now();

    socket.emit('score-loaded', room.score);
    socket.emit('versions-loaded', room.versions);
    broadcastCollaborators(room, roomId);

    console.log(`[Join] User ${userName} (${userId}) joined room ${roomId}`);
    console.log(`  Room ${roomId} now has ${room.collaborators.size} collaborators`);
  });

  socket.on('add-note', ({ roomId, note, userId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const midiPitch = note.octave * 12 + note.pitch;
    if (midiPitch < 0 || midiPitch > 127) return;
    if (note.duration <= 0 || note.position < 0) return;

    const exists = room.score.notes.some(n => n.id === note.id);
    if (exists) return;

    room.score.notes.push(note);
    room.score.updatedAt = Date.now();
    room.lastActivity = Date.now();

    socket.to(roomId).emit('note-added', note);

    scheduleAutoSave(room, roomId);
  });

  socket.on('delete-note', ({ roomId, noteId, userId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const idx = room.score.notes.findIndex(n => n.id === noteId);
    if (idx === -1) return;

    room.score.notes.splice(idx, 1);
    room.score.updatedAt = Date.now();
    room.lastActivity = Date.now();

    socket.to(roomId).emit('note-deleted', noteId);

    scheduleAutoSave(room, roomId);
  });

  socket.on('move-note', ({ roomId, noteId, newPosition, newPitch, userId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const note = room.score.notes.find(n => n.id === noteId);
    if (!note) return;

    const clampedPitch = Math.max(0, Math.min(127, newPitch));
    const clampedPosition = Math.max(0, newPosition);

    const pitchChanged = clampedPitch !== (note.octave * 12 + note.pitch);
    const positionChanged = clampedPosition !== note.position;

    if (!pitchChanged && !positionChanged) return;

    note.octave = Math.floor(clampedPitch / 12);
    note.pitch = clampedPitch % 12;
    note.position = clampedPosition;
    room.score.updatedAt = Date.now();
    room.lastActivity = Date.now();

    socket.to(roomId).emit('note-moved', {
      noteId,
      newPosition: clampedPosition,
      newPitch: clampedPitch
    });

    scheduleAutoSave(room, roomId);
  });

  socket.on('cursor-update', ({ userId, position, roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const collab = room.collaborators.get(userId);
    if (collab) {
      collab.cursorPosition = position;
      socket.to(roomId).emit('cursor-updated', { userId, position });
    }
  });

  socket.on('save-version', ({ roomId, score, userId, userName, message }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const version: VersionSnapshot = {
      id: uuidv4(),
      scoreId: roomId,
      score: JSON.parse(JSON.stringify(score)),
      timestamp: Date.now(),
      author: userName,
      message: message || '手动保存'
    };

    room.versions.unshift(version);
    if (room.versions.length > 50) {
      room.versions.pop();
    }

    room.lastActivity = Date.now();

    io.to(roomId).emit('version-created', version);
    io.to(roomId).emit('versions-loaded', room.versions);

    console.log(`[Save] Version saved in room ${roomId} by ${userName}: ${message || '手动保存'}`);
  });

  socket.on('restored-version', ({ roomId, score }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.score = JSON.parse(JSON.stringify(score));
    room.score.updatedAt = Date.now();
    room.lastActivity = Date.now();

    socket.to(roomId).emit('score-loaded', room.score);
  });

  socket.on('leave-room', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.collaborators.delete(userId);
    room.lastActivity = Date.now();

    socket.leave(roomId);
    broadcastCollaborators(room, roomId);

    console.log(`[Leave] User ${userId} left room ${roomId}`);
    console.log(`  Room ${roomId} now has ${room.collaborators.size} collaborators`);
  });

  socket.on('disconnect', () => {
    if (currentRoomId && currentUserId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.collaborators.delete(currentUserId);
        room.lastActivity = Date.now();

        if (room.autoSaveTimer) {
          clearTimeout(room.autoSaveTimer);
          autoSaveVersion(room, currentRoomId);
        }

        broadcastCollaborators(room, currentRoomId);
      }
    }
    console.log(`[Disconnect] User ${currentUserId} disconnected`);
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    rooms: rooms.size,
    totalCollaborators: Array.from(rooms.values()).reduce((sum, r) => sum + r.collaborators.size, 0)
  });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    id: req.params.roomId,
    collaborators: room.collaborators.size,
    noteCount: room.score.notes.length,
    versionCount: room.versions.length,
    lastActivity: room.lastActivity,
    score: room.score
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

setInterval(() => {
  const now = Date.now();
  const INACTIVE_THRESHOLD = 2 * 60 * 60 * 1000;

  rooms.forEach((room, roomId) => {
    if (room.collaborators.size === 0 && (now - room.lastActivity) > INACTIVE_THRESHOLD) {
      if (room.autoSaveTimer) {
        clearTimeout(room.autoSaveTimer);
      }
      rooms.delete(roomId);
      console.log(`[Cleanup] Inactive room ${roomId} removed`);
    }
  });
}, 30 * 60 * 1000);

server.listen(PORT, () => {
  console.log('');
  console.log('🎵 协作乐谱编辑器服务器已启动');
  console.log('================================');
  console.log(`HTTP 服务器: http://localhost:${PORT}`);
  console.log(`WebSocket:    ws://localhost:${PORT}`);
  console.log(`健康检查:     http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('可用房间列表:');
  console.log('  GET /api/rooms/:roomId');
  console.log('');
});
