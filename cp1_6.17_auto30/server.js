import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

const adapter = new JSONFile('polls.json');
const defaultData = { polls: [], votes: [] };
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
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  
  db.data.polls = db.data.polls.filter((poll) => {
    if (poll.closedAt) {
      return now - poll.closedAt < thirtyDays;
    }
    return true;
  });
  
  db.data.votes = db.data.votes.filter((vote) => {
    const poll = db.data.polls.find((p) => p.id === vote.pollId);
    return !!poll;
  });
  
  db.write();
}

setInterval(cleanupExpiredPolls, 60 * 60 * 1000);

app.get('/api/polls', async (req, res) => {
  await db.read();
  const pollsWithCounts = db.data.polls.map((poll) => {
    const voteCount = db.data.votes.filter((v) => v.pollId === poll.id).length;
    return { ...poll, voteCount };
  });
  res.json(pollsWithCounts);
});

app.get('/api/polls/:shortCode', async (req, res) => {
  await db.read();
  const poll = db.data.polls.find((p) => p.shortCode === req.params.shortCode);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }
  const votes = db.data.votes.filter((v) => v.pollId === poll.id);
  res.json({ ...poll, voteCount: votes.length, votes });
});

app.post('/api/polls', async (req, res) => {
  await db.read();
  const { title, questions } = req.body;
  
  let shortCode;
  let exists;
  do {
    shortCode = generateShortCode();
    exists = db.data.polls.find((p) => p.shortCode === shortCode);
  } while (exists);
  
  const newPoll = {
    id: uuidv4(),
    title,
    shortCode,
    questions,
    createdAt: Date.now(),
    closed: false,
    closedAt: null,
  };
  
  db.data.polls.push(newPoll);
  await db.write();
  
  res.status(201).json({ ...newPoll, voteCount: 0 });
});

app.post('/api/polls/:id/close', async (req, res) => {
  await db.read();
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }
  poll.closed = true;
  poll.closedAt = Date.now();
  await db.write();
  
  io.emit('pollUpdate', { pollId: poll.id, closed: true });
  res.json(poll);
});

app.post('/api/polls/:id/questions', async (req, res) => {
  await db.read();
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }
  
  const { question } = req.body;
  const newQuestion = {
    id: uuidv4(),
    ...question,
  };
  
  poll.questions.push(newQuestion);
  await db.write();
  
  io.emit('pollUpdate', { pollId: poll.id, newQuestion });
  res.json(poll);
});

app.get('/api/results/:pollId', async (req, res) => {
  await db.read();
  const poll = db.data.polls.find((p) => p.id === req.params.pollId);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }
  
  const votes = db.data.votes.filter((v) => v.pollId === req.params.pollId);
  const results = {};
  
  poll.questions.forEach((q) => {
    results[q.id] = {
      questionId: q.id,
      type: q.type,
      data: {},
    };
    
    if (q.type === 'single' || q.type === 'multiple') {
      q.options.forEach((opt) => {
        results[q.id].data[opt] = 0;
      });
    } else if (q.type === 'rating') {
      for (let i = 1; i <= 10; i++) {
        results[q.id].data[i] = 0;
      }
      results[q.id].average = 0;
    }
  });
  
  votes.forEach((vote) => {
    vote.answers.forEach((answer) => {
      const q = poll.questions.find((qq) => qq.id === answer.questionId);
      if (!q) return;
      
      if (q.type === 'single') {
        if (results[q.id].data[answer.value] !== undefined) {
          results[q.id].data[answer.value]++;
        }
      } else if (q.type === 'multiple') {
        if (Array.isArray(answer.value)) {
          answer.value.forEach((v) => {
            if (results[q.id].data[v] !== undefined) {
              results[q.id].data[v]++;
            }
          });
        }
      } else if (q.type === 'rating') {
        const val = Number(answer.value);
        if (val >= 1 && val <= 10) {
          results[q.id].data[val]++;
        }
      }
    });
  });
  
  poll.questions.forEach((q) => {
    if (q.type === 'rating') {
      let total = 0;
      let count = 0;
      for (let i = 1; i <= 10; i++) {
        total += i * results[q.id].data[i];
        count += results[q.id].data[i];
      }
      results[q.id].average = count > 0 ? Number((total / count).toFixed(2)) : 0;
    }
  });
  
  res.json({
    pollId: req.params.pollId,
    totalVotes: votes.length,
    results,
    lastUpdated: Date.now(),
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('newVote', async (data) => {
    await db.read();
    const { pollId, answers } = data;
    
    const poll = db.data.polls.find((p) => p.id === pollId);
    if (!poll || poll.closed) {
      socket.emit('voteError', { error: '投票已关闭或不存在' });
      return;
    }
    
    const newVote = {
      id: uuidv4(),
      pollId,
      answers,
      submittedAt: Date.now(),
    };
    
    db.data.votes.push(newVote);
    await db.write();
    
    io.emit('pollUpdate', { pollId, newVote });
    socket.emit('voteSuccess', { voteId: newVote.id });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
