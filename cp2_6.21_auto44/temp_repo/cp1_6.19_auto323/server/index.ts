import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'data', 'events.json');

function readEvents() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeEvents(events: any[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2));
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(socketId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(socketId);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(socketId, { count: 1, resetTime: now + 1000 });
    return true;
  }
  if (record.count >= 30) return false;
  record.count++;
  return true;
}

app.get('/api/events', (_req, res) => {
  const events = readEvents();
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const events = readEvents();
  const newEvent = {
    id: uuidv4(),
    title: req.body.title,
    date: req.body.date,
    time: req.body.time,
    location: req.body.location,
    description: req.body.description,
    maxParticipants: req.body.maxParticipants,
    currentParticipants: 0,
    likes: 0,
    likedBy: [],
    signedUpUsers: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };
  events.unshift(newEvent);
  writeEvents(events);
  io.emit('event:created', newEvent);
  res.json(newEvent);
});

app.post('/api/events/:id/signup', (req, res) => {
  const { userId } = req.body;
  const events = readEvents();
  const event = events.find((e: any) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: '活动不存在' });
    return;
  }
  if (event.currentParticipants >= event.maxParticipants) {
    res.status(400).json({ error: '席位已满' });
    return;
  }
  if (event.signedUpUsers && event.signedUpUsers.includes(userId)) {
    res.status(400).json({ error: '您已报名该活动' });
    return;
  }
  event.currentParticipants++;
  if (!event.signedUpUsers) event.signedUpUsers = [];
  event.signedUpUsers.push(userId);
  writeEvents(events);
  io.emit('event:updated', event);
  res.json(event);
});

app.post('/api/events/:id/like', (req, res) => {
  const { userId } = req.body;
  const events = readEvents();
  const event = events.find((e: any) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: '活动不存在' });
    return;
  }
  if (!event.likedBy) event.likedBy = [];
  if (event.likedBy.includes(userId)) {
    event.likedBy = event.likedBy.filter((id: string) => id !== userId);
    event.likes = Math.max(0, event.likes - 1);
  } else {
    event.likedBy.push(userId);
    event.likes++;
  }
  writeEvents(events);
  io.emit('event:updated', event);
  res.json(event);
});

app.post('/api/events/:id/comments', (req, res) => {
  const { userId, username, avatar, content } = req.body;
  const events = readEvents();
  const event = events.find((e: any) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: '活动不存在' });
    return;
  }
  const comment = {
    id: uuidv4(),
    userId,
    username,
    avatar,
    content,
    createdAt: new Date().toISOString(),
  };
  event.comments.push(comment);
  writeEvents(events);
  io.emit('event:updated', event);
  res.json(event);
});

let onlineCount = 0;

io.on('connection', (socket) => {
  onlineCount++;
  io.emit('online:count', onlineCount);

  socket.use((_packet, next) => {
    if (checkRateLimit(socket.id)) {
      next();
    } else {
      next(new Error('Rate limited'));
    }
  });

  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online:count', onlineCount);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
