import express from 'express';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const defaultData = { scores: [], comments: [] };
const db = await JSONFilePreset(join(__dirname, 'data', 'db.json'), defaultData);

app.get('/api/scores', (_req, res) => {
  res.json(db.data.scores);
});

app.get('/api/scores/:id', (req, res) => {
  const score = db.data.scores.find(s => s.id === req.params.id);
  if (score) res.json(score);
  else res.status(404).json({ error: 'Score not found' });
});

app.post('/api/scores', async (req, res) => {
  const score = {
    ...req.body,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.data.scores.push(score);
  await db.write();
  res.json(score);
});

app.put('/api/scores/:id', async (req, res) => {
  const idx = db.data.scores.findIndex(s => s.id === req.params.id);
  if (idx !== -1) {
    db.data.scores[idx] = {
      ...db.data.scores[idx],
      ...req.body,
      id: db.data.scores[idx].id,
      updatedAt: new Date().toISOString(),
    };
    await db.write();
    res.json(db.data.scores[idx]);
  } else {
    res.status(404).json({ error: 'Score not found' });
  }
});

app.delete('/api/scores/:id', async (req, res) => {
  db.data.scores = db.data.scores.filter(s => s.id !== req.params.id);
  db.data.comments = db.data.comments.filter(c => c.scoreId !== req.params.id);
  await db.write();
  res.json({ success: true });
});

app.get('/api/comments', (req, res) => {
  let comments = db.data.comments;
  if (req.query.scoreId) comments = comments.filter(c => c.scoreId === req.query.scoreId);
  if (req.query.voiceId) comments = comments.filter(c => c.voiceId === req.query.voiceId);
  res.json(comments);
});

app.post('/api/comments', async (req, res) => {
  const comment = {
    ...req.body,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  db.data.comments.push(comment);
  await db.write();
  res.json(comment);
});

app.put('/api/comments/:id', async (req, res) => {
  const idx = db.data.comments.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    db.data.comments[idx] = { ...db.data.comments[idx], ...req.body };
    await db.write();
    res.json(db.data.comments[idx]);
  } else {
    res.status(404).json({ error: 'Comment not found' });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  db.data.comments = db.data.comments.filter(c => c.id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
