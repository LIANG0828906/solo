import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

const adapter = new JSONFile('polls.json');
const defaultData = { polls: [] };
const db = new Low(adapter, defaultData);

await db.read();

function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function cleanupExpiredPolls() {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  
  const initialCount = db.data.polls.length;
  db.data.polls = db.data.polls.filter((poll) => {
    if (poll.closedAt) {
      return now - poll.closedAt < thirtyDaysMs;
    }
    return true;
  });
  
  const deletedCount = initialCount - db.data.polls.length;
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} expired polls`);
  }
  
  db.write();
}

setInterval(cleanupExpiredPolls, 60 * 60 * 1000);
cleanupExpiredPolls();

app.get('/api/polls', async (req, res) => {
  cleanupExpiredPolls();
  await db.read();
  res.json(db.data.polls);
});

app.get('/api/poll/:shortCode', async (req, res) => {
  cleanupExpiredPolls();
  await db.read();
  const poll = db.data.polls.find((p) => p.shortCode === req.params.shortCode);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  res.json(poll);
});

app.post('/api/polls', async (req, res) => {
  const { title, questions } = req.body;
  const shortCode = generateShortCode();
  const newPoll = {
    id: uuidv4(),
    title,
    shortCode,
    questions,
    votes: [],
    createdAt: Date.now(),
    closed: false,
    closedAt: null,
  };
  db.data.polls.push(newPoll);
  await db.write();
  res.status(201).json(newPoll);
});

app.post('/api/polls/:id/vote', async (req, res) => {
  const { answers } = req.body;
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  if (poll.closed) {
    return res.status(400).json({ error: 'Poll is closed' });
  }
  const vote = {
    id: uuidv4(),
    answers,
    submittedAt: Date.now(),
  };
  poll.votes.push(vote);
  await db.write();
  res.status(201).json(vote);
});

app.post('/api/polls/:id/close', async (req, res) => {
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  poll.closed = true;
  poll.closedAt = Date.now();
  await db.write();
  io.emit('pollUpdate', poll);
  res.json(poll);
});

app.post('/api/polls/:id/questions', async (req, res) => {
  const { question } = req.body;
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  poll.questions.push(question);
  await db.write();
  io.emit('pollUpdate', poll);
  res.json(poll);
});

app.get('/api/polls/:id/results', async (req, res) => {
  cleanupExpiredPolls();
  await db.read();
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  res.json({
    poll,
    results: poll.votes,
  });
});

app.get('/api/polls/:id/export', async (req, res) => {
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  const headers = ['提交时间', ...poll.questions.map((q, i) => `问题${i + 1}: ${q.title}`)];
  const rows = poll.votes.map((vote) => {
    return [
      new Date(vote.submittedAt).toLocaleString('zh-CN'),
      ...poll.questions.map((q, qi) => {
        const answer = vote.answers[qi];
        if (q.type === 'single') return answer || '';
        if (q.type === 'multiple') return (answer || []).join('; ');
        if (q.type === 'rating') return answer || '';
        return '';
      }),
    ];
  });

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${poll.title}_results.csv"`);
  res.send('\uFEFF' + csvContent);
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('newVote', async (data) => {
    const { pollId, answers } = data;
    const poll = db.data.polls.find((p) => p.id === pollId);
    if (poll && !poll.closed) {
      const vote = {
        id: uuidv4(),
        answers,
        submittedAt: Date.now(),
      };
      poll.votes.push(vote);
      await db.write();
      io.emit('pollUpdate', poll);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
