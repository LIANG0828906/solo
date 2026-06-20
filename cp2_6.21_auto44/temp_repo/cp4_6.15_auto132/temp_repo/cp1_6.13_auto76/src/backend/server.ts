import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.resolve(__dirname, '../../server/data');
const MOODS_FILE = path.join(DATA_DIR, 'moods.json');
const HISTORY_FILE = path.join(DATA_DIR, 'userHistory.json');

interface User {
  id: string;
  username: string;
  password: string;
}

interface HistoryEntry {
  mood: string;
  timestamp: string;
}

interface LikeEntry {
  userId: string;
  songId: string;
  action: 'like' | 'dislike';
}

const users = new Map<string, User>();

function readMoodsData() {
  return JSON.parse(fs.readFileSync(MOODS_FILE, 'utf-8'));
}

function readUserHistory() {
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

function writeUserHistory(data: Record<string, HistoryEntry[]> | Record<string, any>) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  for (const user of users.values()) {
    if (user.username === username) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }
  }

  const id = uuidv4();
  const newUser: User = { id, username, password };
  users.set(id, newUser);

  res.status(201).json({ id, username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  for (const user of users.values()) {
    if (user.username === username && user.password === password) {
      res.json({ id: user.id, username: user.username });
      return;
    }
  }

  res.status(401).json({ error: 'Invalid username or password' });
});

app.get('/api/moods/:mood/songs', (req, res) => {
  const { mood } = req.params;
  const validMoods = ['happy', 'calm', 'anxious', 'nostalgic', 'angry'];

  if (!validMoods.includes(mood)) {
    res.status(400).json({ error: `Invalid mood. Valid moods: ${validMoods.join(', ')}` });
    return;
  }

  const moodsData = readMoodsData();
  const moodData = moodsData[mood];

  if (!moodData) {
    res.status(404).json({ error: 'Mood not found' });
    return;
  }

  res.json({
    mood,
    label: moodData.label,
    color: moodData.color,
    description: moodData.description,
    tags: moodData.tags,
    songs: moodData.songs,
  });
});

app.post('/api/songs/like', (req, res) => {
  const { userId, songId, action } = req.body as LikeEntry;

  if (!userId || !songId || !action) {
    res.status(400).json({ error: 'userId, songId, and action are required' });
    return;
  }

  if (action !== 'like' && action !== 'dislike') {
    res.status(400).json({ error: 'Action must be "like" or "dislike"' });
    return;
  }

  const history = readUserHistory();

  if (!history[userId]) {
    history[userId] = { likes: [], dislikes: [] };
  }

  if (!history[userId].likes) history[userId].likes = [];
  if (!history[userId].dislikes) history[userId].dislikes = [];

  if (action === 'like') {
    history[userId].likes = history[userId].likes.filter((s: string) => s !== songId);
    history[userId].likes.push(songId);
    history[userId].dislikes = history[userId].dislikes.filter((s: string) => s !== songId);
  } else {
    history[userId].dislikes = history[userId].dislikes.filter((s: string) => s !== songId);
    history[userId].dislikes.push(songId);
    history[userId].likes = history[userId].likes.filter((s: string) => s !== songId);
  }

  writeUserHistory(history);

  res.json({ success: true, userId, songId, action });
});

app.get('/api/user/:userId/history', (req, res) => {
  const { userId } = req.params;
  const history = readUserHistory();

  if (!history[userId]) {
    res.json({ userId, history: [] });
    return;
  }

  const userHistory = history[userId].emotionHistory || [];
  res.json({ userId, history: userHistory });
});

app.post('/api/user/:userId/history', (req, res) => {
  const { userId } = req.params;
  const { mood, timestamp } = req.body as HistoryEntry;

  if (!mood) {
    res.status(400).json({ error: 'mood is required' });
    return;
  }

  const history = readUserHistory();

  if (!history[userId]) {
    history[userId] = { likes: [], dislikes: [], emotionHistory: [] };
  }

  if (!history[userId].emotionHistory) {
    history[userId].emotionHistory = [];
  }

  history[userId].emotionHistory.push({
    mood,
    timestamp: timestamp || new Date().toISOString(),
  });

  writeUserHistory(history);

  res.json({ success: true, userId, entry: { mood, timestamp: timestamp || new Date().toISOString() } });
});

app.listen(PORT, () => {
  console.log(`MoodTune server running on http://localhost:${PORT}`);
});
