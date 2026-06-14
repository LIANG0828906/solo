import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';

interface BoardState {
  strokes: unknown[];
  stickies: unknown[];
  images: unknown[];
}

interface RoomState {
  state: BoardState;
  users: Map<string, { ws: WebSocket; name: string }>;
}

const rooms = new Map<string, RoomState>();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/sessions', (req, res) => {
  const sessionId = uuid();
  const userId = uuid();
  const userName = req.body.userName || 'User';
  rooms.set(sessionId, {
    state: { strokes: [], stickies: [], images: [] },
    users: new Map(),
  });
  res.json({ sessionId, userId, userName });
});

app.post('/api/sessions/:id/join', (req, res) => {
  const sessionId = req.params.id;
  const userId = uuid();
  const userName = req.body.userName || 'User';
  if (!rooms.has(sessionId)) {
    rooms.set(sessionId, {
      state: { strokes: [], stickies: [], images: [] },
      users: new Map(),
    });
  }
  res.json({ sessionId, userId, userName });
});

app.get('/api/sessions/:id/state', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.json({ state: { strokes: [], stickies: [], images: [] } });
  }
  res.json({ state: room.state });
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const ext = path.extname(req.file.originalname) || '.png';
  const filename = `${uuid()}${ext}`;
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
  res.json({ url: `/uploads/${filename}` });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const params = new URL(req.url || '', 'http://localhost');
  const sessionId = params.searchParams.get('sessionId') || '';
  const userId = params.searchParams.get('userId') || '';

  if (!sessionId || !userId) {
    ws.close();
    return;
  }

  if (!rooms.has(sessionId)) {
    rooms.set(sessionId, {
      state: { strokes: [], stickies: [], images: [] },
      users: new Map(),
    });
  }

  const room = rooms.get(sessionId)!;
  room.users.set(userId, { ws, name: userId.slice(0, 6) });

  ws.send(JSON.stringify({ type: 'init', sessionId, state: room.state }));

  room.users.forEach((user, uid) => {
    if (uid !== userId && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(JSON.stringify({ type: 'user_join', userId, params: { name: userId.slice(0, 6) } }));
    }
  });

  const userList = Array.from(room.users.keys()).filter((uid) => uid !== userId);
  if (userList.length > 0) {
    ws.send(JSON.stringify({ type: 'user_join', userId: userList[0], params: { name: 'existing' } }));
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'operation') {
        const { operation, params: opParams } = msg;
        updateRoomState(room, operation, opParams);

        room.users.forEach((user, uid) => {
          if (uid !== userId && user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(JSON.stringify({ type: 'operation', userId, operation, params: opParams }));
          }
        });
      }
    } catch (e) {
      console.error('WS message parse error:', e);
    }
  });

  ws.on('close', () => {
    room.users.delete(userId);
    room.users.forEach((user) => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify({ type: 'user_leave', userId }));
      }
    });
    if (room.users.size === 0) {
      rooms.delete(sessionId);
    }
  });
});

function updateRoomState(room: RoomState, operation: string, params: Record<string, unknown>) {
  switch (operation) {
    case 'draw':
    case 'erase':
      if (params.stroke) room.state.strokes.push(params.stroke);
      break;
    case 'addSticky':
      if (params.note) room.state.stickies.push(params.note);
      break;
    case 'moveSticky': {
      const { id, x, y } = params as { id: string; x: number; y: number };
      const note = room.state.stickies.find((s: any) => s.id === id) as any;
      if (note) { note.x = x; note.y = y; }
      break;
    }
    case 'updateStickyText': {
      const { id, text } = params as { id: string; text: string };
      const note = room.state.stickies.find((s: any) => s.id === id) as any;
      if (note) note.text = text;
      break;
    }
    case 'deleteSticky': {
      const { id } = params as { id: string };
      room.state.stickies = room.state.stickies.filter((s: any) => s.id !== id);
      break;
    }
    case 'addImage':
      if (params.image) room.state.images.push(params.image);
      break;
    case 'moveImage': {
      const { id, x, y } = params as { id: string; x: number; y: number };
      const img = room.state.images.find((i: any) => i.id === id) as any;
      if (img) { img.x = x; img.y = y; }
      break;
    }
    case 'deleteImage': {
      const { id } = params as { id: string };
      room.state.images = room.state.images.filter((i: any) => i.id !== id);
      break;
    }
  }
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
