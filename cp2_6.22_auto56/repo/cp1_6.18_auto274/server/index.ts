import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import type { Marker, User, RoomState, HistorySnapshot } from '../src/types';

interface Room {
  id: string;
  users: Map<string, User>;
  markers: Marker[];
  history: HistorySnapshot[];
  createdAt: number;
}

const rooms = new Map<string, Room>();
const HISTORY_INTERVAL = 30000;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      users: new Map(),
      markers: [],
      history: [],
      createdAt: Date.now(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

function takeHistorySnapshot(room: Room) {
  const now = Date.now();
  const lastSnapshot = room.history[room.history.length - 1];
  if (!lastSnapshot || now - lastSnapshot.timestamp >= HISTORY_INTERVAL) {
    room.history.push({
      timestamp: now,
      markers: JSON.parse(JSON.stringify(room.markers)),
    });
  }
}

function getMarkersAtTime(room: Room, targetTime: number): Marker[] {
  if (room.history.length === 0) {
    return room.markers.filter((m) => !m.isDeleted);
  }

  let left = 0;
  let right = room.history.length - 1;
  let result = room.history[0];

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (room.history[mid].timestamp <= targetTime) {
      result = room.history[mid];
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result.markers.filter((m) => !m.isDeleted);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ nickname, roomId }: { nickname: string; roomId: string }) => {
    if (!nickname || !roomId) return;
    if (nickname.length < 2 || nickname.length > 8) return;
    if (!/^\d{4}$/.test(roomId)) return;

    const room = getOrCreateRoom(roomId);
    const user: User = {
      id: socket.id,
      nickname,
      roomId,
      joinedAt: Date.now(),
    };

    room.users.set(socket.id, user);
    socket.join(roomId);
    takeHistorySnapshot(room);

    const roomState: RoomState = {
      roomId,
      users: Array.from(room.users.values()),
      markers: room.markers.filter((m) => !m.isDeleted),
      createdAt: room.createdAt,
    };

    socket.emit('room-joined', roomState);
    socket.to(roomId).emit('user-joined', { user });

    console.log(`User ${nickname} joined room ${roomId}`);
  });

  socket.on('add-marker', ({ roomId, position, text }: { roomId: string; position: { x: number; y: number; z: number }; text: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    const marker: Marker = {
      id: uuidv4(),
      position: { ...position },
      text: text.slice(0, 100),
      author: user.nickname,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    room.markers.push(marker);
    takeHistorySnapshot(room);

    io.to(roomId).emit('marker-added', { marker });
  });

  socket.on('edit-marker', ({ roomId, markerId, text }: { roomId: string; markerId: string; text: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const marker = room.markers.find((m) => m.id === markerId);
    if (!marker || marker.isDeleted) return;

    marker.text = text.slice(0, 100);
    marker.updatedAt = Date.now();
    takeHistorySnapshot(room);

    io.to(roomId).emit('marker-edited', { marker });
  });

  socket.on('delete-marker', ({ roomId, markerId }: { roomId: string; markerId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const marker = room.markers.find((m) => m.id === markerId);
    if (!marker) return;

    marker.isDeleted = true;
    marker.updatedAt = Date.now();
    takeHistorySnapshot(room);

    io.to(roomId).emit('marker-deleted', { markerId });
  });

  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms) {
      if (room.users.has(socket.id)) {
        const user = room.users.get(socket.id)!;
        room.users.delete(socket.id);
        socket.to(roomId).emit('user-left', { userId: socket.id });
        console.log(`User ${user.nickname} left room ${roomId}`);

        if (room.users.size === 0) {
          setTimeout(() => {
            const r = rooms.get(roomId);
            if (r && r.users.size === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} deleted (empty)`);
            }
          }, 60000);
        }
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

app.get('/api/rooms/:roomId/markers', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ markers: room.markers.filter((m) => !m.isDeleted) });
});

app.get('/api/rooms/:roomId/history', (req, res) => {
  const { roomId } = req.params;
  const time = req.query.time ? Number(req.query.time) : Date.now();
  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  const markers = getMarkersAtTime(room, time);
  res.json({ markers, timestamp: time });
});

app.get('/api/export/:roomId', (req, res) => {
  const { roomId } = req.params;
  const time = req.query.time ? Number(req.query.time) : undefined;
  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  let markers: Marker[];
  let snapshotTime: number | undefined;
  if (time) {
    markers = getMarkersAtTime(room, time);
    snapshotTime = time;
  } else {
    markers = room.markers.filter((m) => !m.isDeleted);
  }

  const exportData = {
    roomId,
    exportTime: new Date().toISOString(),
    snapshotTime: snapshotTime ? new Date(snapshotTime).toISOString() : undefined,
    markers: markers.map((m) => ({
      id: m.id,
      position: m.position,
      text: m.text,
      author: m.author,
      timestamp: new Date(m.createdAt).toISOString(),
    })),
    thumbnail: '',
  };

  res.json(exportData);
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
