const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const votes = new Map();

app.post('/api/votes', (req, res) => {
  const { title, options, duration } = req.body;
  if (!title || !options || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const createdAt = Date.now();
  const vote = {
    id: uuidv4(),
    title,
    options: options.map((text) => ({ id: uuidv4(), text, votes: [] })),
    duration,
    createdAt,
    deadline: createdAt + duration * 60000,
  };
  votes.set(vote.id, vote);
  res.status(201).json(vote);
});

app.get('/api/votes', (req, res) => {
  res.json(Array.from(votes.values()));
});

app.post('/api/votes/:id/vote', (req, res) => {
  const vote = votes.get(req.params.id);
  if (!vote) {
    return res.status(404).json({ error: 'Vote not found' });
  }
  if (Date.now() > vote.deadline) {
    return res.status(400).json({ error: 'Vote expired' });
  }
  const { userId, optionId } = req.body;
  if (!userId || !optionId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const alreadyVoted = vote.options.some((opt) => opt.votes.includes(userId));
  if (alreadyVoted) {
    return res.status(400).json({ error: '已投票' });
  }
  const option = vote.options.find((opt) => opt.id === optionId);
  if (!option) {
    return res.status(400).json({ error: 'Option not found' });
  }
  option.votes.push(userId);
  res.json(vote);
});

app.get('/api/votes/:id/stats', (req, res) => {
  const vote = votes.get(req.params.id);
  if (!vote) {
    return res.status(404).json({ error: 'Vote not found' });
  }
  const total = vote.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const stats = vote.options.map((opt) => ({
    optionId: opt.id,
    text: opt.text,
    count: opt.votes.length,
    percentage: total === 0 ? 0 : Math.round((opt.votes.length / total) * 10000) / 100,
  }));
  res.json({ vote, stats });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
