const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const votes = [];

function createSampleData() {
  const sample1 = {
    id: uuidv4(),
    title: '最喜欢的编程语言',
    description: '选出你心中最受欢迎的编程语言',
    options: [
      { id: uuidv4(), text: 'JavaScript', votes: 42 },
      { id: uuidv4(), text: 'Python', votes: 38 },
      { id: uuidv4(), text: 'TypeScript', votes: 27 },
      { id: uuidv4(), text: 'Go', votes: 15 },
    ],
    createdAt: new Date().toISOString(),
    totalVotes: 122,
  };

  const sample2 = {
    id: uuidv4(),
    title: '远程办公 vs 线下办公',
    description: '你更倾向于哪种工作方式？',
    options: [
      { id: uuidv4(), text: '完全远程', votes: 56 },
      { id: uuidv4(), text: '完全线下', votes: 12 },
      { id: uuidv4(), text: '混合办公', votes: 73 },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    totalVotes: 141,
  };

  const sample3 = {
    id: uuidv4(),
    title: '最佳前端框架',
    description: '2026年你认为最值得学习的前端框架是哪个？',
    options: [
      { id: uuidv4(), text: 'React', votes: 34 },
      { id: uuidv4(), text: 'Vue', votes: 29 },
      { id: uuidv4(), text: 'Angular', votes: 11 },
      { id: uuidv4(), text: 'Svelte', votes: 18 },
      { id: uuidv4(), text: 'Solid', votes: 7 },
    ],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    totalVotes: 99,
  };

  votes.push(sample1, sample2, sample3);
}

createSampleData();

app.post('/api/votes', (req, res) => {
  const { title, description, options } = req.body;

  if (!title || !options || !Array.isArray(options) || options.length === 0) {
    return res.status(400).json({ error: 'title and options are required' });
  }

  const vote = {
    id: uuidv4(),
    title,
    description: description || '',
    options: options.map((text) => ({
      id: uuidv4(),
      text,
      votes: 0,
    })),
    createdAt: new Date().toISOString(),
    totalVotes: 0,
  };

  votes.push(vote);
  res.status(201).json(vote);
});

app.get('/api/votes', (req, res) => {
  const list = votes.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    optionCount: v.options.length,
    totalVotes: v.totalVotes,
    createdAt: v.createdAt,
  }));
  res.json(list);
});

app.post('/api/votes/:id/vote', (req, res) => {
  const { id } = req.params;
  const { optionId } = req.body;

  const vote = votes.find((v) => v.id === id);
  if (!vote) {
    return res.status(404).json({ error: 'Vote not found' });
  }

  const option = vote.options.find((o) => o.id === optionId);
  if (!option) {
    return res.status(404).json({ error: 'Option not found' });
  }

  option.votes += 1;
  vote.totalVotes += 1;

  res.json(vote);
});

app.get('/api/votes/:id/results', (req, res) => {
  const { id } = req.params;

  const vote = votes.find((v) => v.id === id);
  if (!vote) {
    return res.status(404).json({ error: 'Vote not found' });
  }

  res.json({
    id: vote.id,
    title: vote.title,
    description: vote.description,
    options: vote.options,
    totalVotes: vote.totalVotes,
    createdAt: vote.createdAt,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
