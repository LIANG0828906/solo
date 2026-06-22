import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}.pdf`),
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      participants: new Map(),
      operations: [],
      locked: false,
      muted: false,
    });
  }
  return rooms.get(roomId);
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('roomId') || 'default';
  const userId = url.searchParams.get('userId') || uuidv4();

  const room = getRoom(roomId);
  ws._roomId = roomId;
  ws._userId = userId;

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, payload } = data;

      switch (type) {
        case 'heartbeat':
          ws.send(JSON.stringify({ type: 'heartbeat', payload: {} }));
          break;

        case 'join':
          room.participants.set(userId, {
            ws,
            userName: payload.userName,
            role: payload.role,
            avatarColor: payload.avatarColor,
          });
          const participantList = Array.from(room.participants.entries()).map(([id, p]) => ({
            userId: id,
            userName: p.userName,
            role: p.role,
            avatarColor: p.avatarColor,
          }));
          room.participants.forEach((p, id) => {
            if (p.ws.readyState === WebSocket.OPEN && id !== userId) {
              p.ws.send(JSON.stringify({ type: 'join', payload: { userId, ...payload } }));
            }
            if (id === userId) {
              p.ws.send(JSON.stringify({ type: 'participants', payload: { list: participantList } }));
              p.ws.send(JSON.stringify({ type: 'lock', payload: { locked: room.locked } }));
              p.ws.send(JSON.stringify({ type: 'mute', payload: { muted: room.muted } }));
            }
          });
          break;

        case 'draw':
          room.operations.push(payload);
          if (room.operations.length > 5000) {
            room.operations = room.operations.slice(-3000);
          }
          room.participants.forEach((p, id) => {
            if (p.ws.readyState === WebSocket.OPEN && id !== userId) {
              p.ws.send(JSON.stringify({ type: 'draw', payload }));
            }
          });
          break;

        case 'chat':
          room.participants.forEach((p, id) => {
            if (p.ws.readyState === WebSocket.OPEN && id !== userId) {
              p.ws.send(JSON.stringify({ type: 'chat', payload: { ...payload, userId } }));
            }
          });
          break;

        case 'lock':
          room.locked = payload.locked;
          room.participants.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({ type: 'lock', payload: { locked: room.locked } }));
            }
          });
          break;

        case 'mute':
          room.muted = payload.muted;
          room.participants.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({ type: 'mute', payload: { muted: room.muted } }));
            }
          });
          break;

        case 'leave':
          room.participants.delete(userId);
          room.participants.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({ type: 'leave', payload: { userId } }));
            }
          });
          break;
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });

  ws.on('close', () => {
    room.participants.delete(userId);
    room.participants.forEach((p) => {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({ type: 'leave', payload: { userId } }));
      }
    });
  });
});

app.post('/api/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/api/pdf/${req.file.filename}`;
  res.json({ url: fileUrl, fileName: req.file.originalname });
});

app.get('/api/pdf/:file', (req, res) => {
  const filePath = path.join(uploadDir, req.params.file);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not found');
  }
});

app.use(express.static(path.join(process.cwd(), 'dist')));

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
