import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'bottles.json');

app.use(cors());
app.use(bodyParser.json());

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = [
      {
        id: uuidv4(),
        text: '今天阳光很好，希望看到这个瓶子的你也有好心情！',
        createdAt: new Date().toISOString(),
        feedbackEmoji: { encourage: 5, speechlessness: 0 },
        createdBy: 'system'
      },
      {
        id: uuidv4(),
        text: '每一个不曾起舞的日子，都是对生命的辜负。——尼采',
        createdAt: new Date().toISOString(),
        feedbackEmoji: { encourage: 12, speechlessness: 1 },
        createdBy: 'system'
      },
      {
        id: uuidv4(),
        text: '生活不止眼前的苟且，还有诗和远方的田野。',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        createdAt: new Date().toISOString(),
        feedbackEmoji: { encourage: 8, speechlessness: 2 },
        createdBy: 'system'
      },
      {
        id: uuidv4(),
        text: '你要悄悄努力，然后惊艳所有人！',
        createdAt: new Date().toISOString(),
        feedbackEmoji: { encourage: 15, speechlessness: 0 },
        createdBy: 'system'
      },
      {
        id: uuidv4(),
        text: '今天学到了一个新的编程技巧，分享给大家：保持好奇心，永远不要停止学习！',
        createdAt: new Date().toISOString(),
        feedbackEmoji: { encourage: 6, speechlessness: 0 },
        createdBy: 'system'
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
};

const readBottles = () => {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeBottles = (bottles) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(bottles, null, 2));
};

app.get('/api/bottles/random', (req, res) => {
  const bottles = readBottles();
  const exclude = req.query.exclude;
  const excludeIds = Array.isArray(exclude) ? exclude : exclude ? [exclude] : [];
  
  const availableBottles = bottles.filter(b => !excludeIds.includes(b.id));
  
  if (availableBottles.length === 0) {
    return res.status(404).json({ error: 'No bottles available' });
  }
  
  const randomIndex = Math.floor(Math.random() * availableBottles.length);
  res.json(availableBottles[randomIndex]);
});

app.post('/api/bottles', (req, res) => {
  const { text, imageUrl, createdBy } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  const newBottle = {
    id: uuidv4(),
    text: text.trim(),
    imageUrl: imageUrl?.trim() || undefined,
    createdAt: new Date().toISOString(),
    feedbackEmoji: { encourage: 0, speechlessness: 0 },
    createdBy
  };
  
  const bottles = readBottles();
  bottles.push(newBottle);
  writeBottles(bottles);
  
  res.status(201).json(newBottle);
});

app.get('/api/bottles/user/:userId', (req, res) => {
  const { userId } = req.params;
  const bottles = readBottles();
  const userBottles = bottles.filter(b => b.createdBy === userId);
  res.json(userBottles);
});

app.delete('/api/bottles/:bottleId', (req, res) => {
  const { bottleId } = req.params;
  const bottles = readBottles();
  const index = bottles.findIndex(b => b.id === bottleId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Bottle not found' });
  }
  
  bottles.splice(index, 1);
  writeBottles(bottles);
  res.status(204).send();
});

app.post('/api/bottles/:bottleId/feedback', (req, res) => {
  const { bottleId } = req.params;
  const { emoji } = req.body;
  
  if (!emoji || (emoji !== 'encourage' && emoji !== 'speechlessness')) {
    return res.status(400).json({ error: 'Invalid emoji type' });
  }
  
  const bottles = readBottles();
  const bottle = bottles.find(b => b.id === bottleId);
  
  if (!bottle) {
    return res.status(404).json({ error: 'Bottle not found' });
  }
  
  if (emoji === 'encourage') {
    bottle.feedbackEmoji.encourage += 1;
  } else if (emoji === 'speechlessness') {
    bottle.feedbackEmoji.speechlessness += 1;
  }
  writeBottles(bottles);
  res.json(bottle);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  ensureDataFile();
});
