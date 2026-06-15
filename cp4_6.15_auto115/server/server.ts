import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());

const dataPath = path.join(__dirname, 'data', 'moods.json');

function readData() {
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data: any) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/moods/:userId', (req, res) => {
  const data = readData();
  const userId = req.params.userId;
  const moods = data.moods.filter((m: any) => m.userId === userId);
  res.json(moods);
});

app.post('/api/moods', (req, res) => {
  const data = readData();
  const newMood = {
    id: uuidv4(),
    ...req.body,
  };
  data.moods.push(newMood);
  writeData(data);
  res.json(newMood);
});

app.get('/api/community', (req, res) => {
  const data = readData();
  const today = new Date('2026-06-15');
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = threeDaysAgo.toISOString().split('T')[0];
  const community = data.moods.filter((m: any) => {
    return m.userId !== 'user1' && m.date >= cutoff;
  });
  const result = community.map((m: any) => {
    const user = data.users.find((u: any) => u.id === m.userId);
    return { ...m, userName: user?.name || '未知', userAvatar: user?.avatar || '👤' };
  });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`🌸 情绪气象站后端运行在 http://localhost:${PORT}`);
});
