import express from 'express';
import cors from 'cors';
import type { Score } from './types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let scores: Score[] = [
  { name: '重力大师', score: 2850 },
  { name: '跑酷王者', score: 2430 },
  { name: '翻转达人', score: 1980 },
  { name: '星星猎手', score: 1560 },
  { name: '新手玩家', score: 890 },
];

app.post('/api/scores', (req, res) => {
  const { name, score } = req.body as Score;
  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score data' });
  }
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 50);
  res.json({ success: true });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(scores.slice(0, 10));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
