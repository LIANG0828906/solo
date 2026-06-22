import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import type { Inspiration, InspirationType } from '../src/types';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use('/uploads', express.static(uploadDir));

const inspirations = new Map<string, Inspiration>();
const allTags = new Set<string>();

function generateThumbnail(imageData: string, w = 200, h = 150): string {
  return imageData;
}

function createMockData() {
  const samples: Array<Omit<Inspiration, 'id' | 'createdAt'>> = [
    {
      type: 'text',
      content: '<p><b>产品创意</b>：做一个专注于微习惯追踪的应用，每天只需要完成一个5分钟的小任务，用<i>连续打卡</i>激励用户坚持。</p><ul><li>极简设计</li><li>游戏化奖励</li><li>社交分享</li></ul>',
      tags: ['产品', '创意'],
    },
    {
      type: 'text',
      content: '<p>今天早上在地铁上的灵感：<b>AI 辅助写作</b>可以结合<b>上下文感知</b>，在用户写邮件时自动识别收件人关系并推荐语气风格。</p>',
      tags: ['AI', '写作'],
    },
    {
      type: 'voice',
      content: '关于用户界面设计的一些思考。需要让交互更加直觉化，减少用户的认知负担。每一个按钮的位置都应该符合人体工学的设计原则。',
      tags: ['设计', 'UI'],
      duration: 12,
    },
    {
      type: 'text',
      content: '<p><i>"简单就是终极的复杂"</i> — 达·芬奇</p><p>这句话提醒我在做产品时要不断做减法，去掉所有不必要的元素，只留下最核心的功能。</p>',
      tags: ['思考', '设计哲学'],
    },
  ];

  const now = Date.now();
  samples.forEach((sample, idx) => {
    const id = uuidv4();
    const item: Inspiration = {
      id,
      ...sample,
      createdAt: now - idx * 3600000,
    };
    inspirations.set(id, item);
    sample.tags.forEach((t) => allTags.add(t));
  });
}
createMockData();

app.get('/api/inspirations', (_req, res) => {
  const list = Array.from(inspirations.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json(list);
});

app.get('/api/inspirations/random', (_req, res) => {
  const list = Array.from(inspirations.values());
  if (list.length === 0) {
    return res.status(404).json({ error: 'No inspirations' });
  }
  const random = list[Math.floor(Math.random() * list.length)];
  res.json(random);
});

app.get('/api/inspirations/:id', (req, res) => {
  const item = inspirations.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/inspirations', (req, res) => {
  const { type, content, tags, thumbnail, duration, audioUrl, drawingData } = req.body;
  if (!type || !content) {
    return res.status(400).json({ error: 'type and content required' });
  }
  const id = uuidv4();
  const item: Inspiration = {
    id,
    type: type as InspirationType,
    content,
    tags: tags || [],
    createdAt: Date.now(),
    thumbnail: drawingData ? generateThumbnail(drawingData) : thumbnail,
    duration,
    audioUrl,
    drawingData,
  };
  inspirations.set(id, item);
  (tags || []).forEach((t: string) => allTags.add(t));
  io.emit('inspiration:created', item);
  res.status(201).json(item);
});

app.put('/api/inspirations/:id', (req, res) => {
  const existing = inspirations.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = { ...existing, ...req.body, id: existing.id };
  inspirations.set(req.params.id, updated);
  io.emit('inspiration:updated', updated);
  res.json(updated);
});

app.delete('/api/inspirations/:id', (req, res) => {
  const deleted = inspirations.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  io.emit('inspiration:deleted', req.params.id);
  res.json({ success: true });
});

app.post('/api/upload/audio', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get('/api/tags', (_req, res) => {
  res.json(Array.from(allTags));
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
