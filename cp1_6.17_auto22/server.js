import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const dbFile = path.join(__dirname, 'polls.json');
const adapter = new JSONFile(dbFile);
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

function cleanupOldPolls() {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const initialLength = db.data.polls.length;
  db.data.polls = db.data.polls.filter(poll => {
    if (poll.isClosed && poll.closedAt) {
      return (now - new Date(poll.closedAt).getTime()) < thirtyDays;
    }
    return true;
  });
  if (db.data.polls.length !== initialLength) {
    db.write();
  }
}

setInterval(cleanupOldPolls, 60 * 60 * 1000);

app.get('/api/polls', (req, res) => {
  const polls = db.data.polls.map(p => ({
    id: p.id,
    shortCode: p.shortCode,
    title: p.title,
    isClosed: p.isClosed,
    createdAt: p.createdAt,
    closedAt: p.closedAt,
    voteCount: p.votes.length,
    questionCount: p.questions.length
  }));
  res.json(polls);
});

app.get('/api/polls/:id', (req, res) => {
  const poll = db.data.polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  res.json(poll);
});

app.post('/api/polls', async (req, res) => {
  const { title, questions } = req.body;
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ error: '标题和题目不能为空' });
  }

  let shortCode;
  do {
    shortCode = generateShortCode();
  } while (db.data.polls.some(p => p.shortCode === shortCode));

  const newPoll = {
    id: uuidv4(),
    shortCode,
    title,
    questions: questions.map(q => ({
      id: uuidv4(),
      type: q.type,
      title: q.title,
      options: q.options,
      minRating: q.minRating || 1,
      maxRating: q.maxRating || 10
    })),
    isClosed: false,
    createdAt: new Date().toISOString(),
    closedAt: null,
    votes: []
  };

  db.data.polls.push(newPoll);
  await db.write();

  io.emit('pollUpdate', { pollId: newPoll.id, poll: {
    id: newPoll.id,
    shortCode: newPoll.shortCode,
    title: newPoll.title,
    isClosed: newPoll.isClosed,
    createdAt: newPoll.createdAt,
    voteCount: 0,
    questionCount: newPoll.questions.length
  }});

  res.status(201).json(newPoll);
});

app.post('/api/polls/:id/close', async (req, res) => {
  const poll = db.data.polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: '投票不存在' });

  poll.isClosed = true;
  poll.closedAt = new Date().toISOString();
  await db.write();

  io.emit('pollUpdate', { pollId: poll.id, poll: {
    id: poll.id,
    shortCode: poll.shortCode,
    title: poll.title,
    isClosed: true,
    createdAt: poll.createdAt,
    closedAt: poll.closedAt,
    voteCount: poll.votes.length,
    questionCount: poll.questions.length
  }});

  res.json(poll);
});

app.post('/api/polls/:id/questions', async (req, res) => {
  const poll = db.data.polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  if (poll.isClosed) return res.status(400).json({ error: '投票已关闭' });

  const question = req.body;
  const newQuestion = {
    id: uuidv4(),
    type: question.type,
    title: question.title,
    options: question.options,
    minRating: question.minRating || 1,
    maxRating: question.maxRating || 10
  };

  poll.questions.push(newQuestion);
  await db.write();

  io.emit('pollUpdate', { pollId: poll.id, poll });

  res.json(poll);
});

app.get('/api/polls/shortcode/:shortCode', (req, res) => {
  const poll = db.data.polls.find(p => p.shortCode === req.params.shortCode.toUpperCase());
  if (!poll) {
    return res.json({ exists: false });
  }
  res.json({
    exists: true,
    pollId: poll.id,
    isClosed: poll.isClosed,
    title: poll.title,
    questions: poll.questions
  });
});

app.get('/api/polls/:id/export', (req, res) => {
  const poll = db.data.polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: '投票不存在' });

  const headers = ['提交时间', ...poll.questions.map(q => q.title)];
  const rows = poll.votes.map(vote => {
    const row = [vote.submittedAt];
    poll.questions.forEach(q => {
      const answer = vote.answers.find(a => a.questionId === q.id);
      if (answer) {
        if (Array.isArray(answer.value)) {
          row.push(answer.value.join('; '));
        } else {
          row.push(String(answer.value));
        }
      } else {
        row.push('');
      }
    });
    return row;
  });

  const csv = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="poll_${poll.shortCode}.csv"`);
  res.send('\uFEFF' + csv);
});

app.post('/api/votes', async (req, res) => {
  const { pollId, answers } = req.body;
  const poll = db.data.polls.find(p => p.id === pollId);
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  if (poll.isClosed) return res.status(400).json({ error: '投票已关闭' });

  const vote = {
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
    answers
  };

  poll.votes.push(vote);
  await db.write();

  io.emit('pollUpdate', { pollId: poll.id, poll });

  res.json({ success: true, vote });
});

io.on('connection', (socket) => {
  socket.on('newVote', async (data) => {
    const { pollId, answers } = data;
    const poll = db.data.polls.find(p => p.id === pollId);
    if (!poll || poll.isClosed) return;

    const vote = {
      id: uuidv4(),
      submittedAt: new Date().toISOString(),
      answers
    };

    poll.votes.push(vote);
    await db.write();

    io.emit('pollUpdate', { pollId: poll.id, poll });
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
