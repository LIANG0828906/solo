import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
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
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

const dbFile = path.join(__dirname, 'polls.json');
const defaultData = { polls: [] };
const db = new Low(new JSONFile(dbFile), defaultData);

await db.read();
if (!db.data) {
  db.data = defaultData;
  await db.write();
}

const SHORTCODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateShortCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += SHORTCODE_CHARS.charAt(Math.floor(Math.random() * SHORTCODE_CHARS.length));
  }
  return code;
}

function generateUniqueShortCode() {
  const existing = new Set(db.data.polls.map((p) => p.shortCode));
  let code;
  do {
    code = generateShortCode();
  } while (existing.has(code));
  return code;
}

function cleanupExpiredPolls() {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const beforeCount = db.data.polls.length;
  db.data.polls = db.data.polls.filter((p) => {
    if (!p.closedAt) return true;
    return now - p.closedAt < THIRTY_DAYS_MS;
  });
  if (db.data.polls.length !== beforeCount) {
    db.write();
    console.log(`[Cleanup] 删除 ${beforeCount - db.data.polls.length} 个过期投票`);
  }
}

setInterval(cleanupExpiredPolls, 60 * 60 * 1000);
cleanupExpiredPolls();

function buildResultStats(poll) {
  return poll.questions.map((q) => {
    const stats = { questionId: q.id, type: q.type, title: q.title };
    const answers = poll.submissions.map((s) => s.answers[q.id]).filter((a) => a !== undefined);
    if (q.type === 'single') {
      const counts = {};
      (q.options || []).forEach((opt) => (counts[opt] = 0));
      answers.forEach((a) => {
        if (counts[a] !== undefined) counts[a]++;
      });
      stats.data = Object.entries(counts).map(([label, value]) => ({ label, value }));
      stats.total = answers.length;
    } else if (q.type === 'multiple') {
      const counts = {};
      (q.options || []).forEach((opt) => (counts[opt] = 0));
      answers.forEach((arr) => {
        if (Array.isArray(arr)) {
          arr.forEach((opt) => {
            if (counts[opt] !== undefined) counts[opt]++;
          });
        }
      });
      stats.data = Object.entries(counts).map(([label, value]) => ({ label, value }));
      stats.total = answers.length;
    } else if (q.type === 'rating') {
      const numeric = answers.map((n) => Number(n)).filter((n) => !isNaN(n) && n >= 1 && n <= 10);
      const bucketCounts = Array.from({ length: 10 }, (_, i) => ({
        label: `${i + 1}分`,
        rating: i + 1,
        value: 0,
      }));
      numeric.forEach((n) => {
        bucketCounts[n - 1].value++;
      });
      stats.data = bucketCounts;
      stats.total = numeric.length;
      stats.average = numeric.length > 0 ? numeric.reduce((a, b) => a + b, 0) / numeric.length : 0;
      stats.trend = [];
      const sorted = poll.submissions
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((s, idx) => {
          const val = Number(s.answers[q.id]);
          return {
            index: idx + 1,
            value: !isNaN(val) && val >= 1 && val <= 10 ? val : null,
          };
        })
        .filter((x) => x.value !== null);
      let runningSum = 0;
      sorted.forEach((item, i) => {
        runningSum += item.value;
        stats.trend.push({
          index: i + 1,
          average: Number((runningSum / (i + 1)).toFixed(2)),
        });
      });
    }
    return stats;
  });
}

app.get('/api/polls', (_req, res) => {
  const polls = db.data.polls
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((p) => ({
      id: p.id,
      shortCode: p.shortCode,
      title: p.title,
      description: p.description,
      questionCount: p.questions.length,
      submissionCount: p.submissions.length,
      createdAt: p.createdAt,
      isActive: p.isActive,
      closedAt: p.closedAt,
    }));
  res.json(polls);
});

app.get('/api/polls/code/:shortCode', (req, res) => {
  const poll = db.data.polls.find((p) => p.shortCode === req.params.shortCode.toUpperCase());
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  res.json({
    id: poll.id,
    shortCode: poll.shortCode,
    title: poll.title,
    description: poll.description,
    questions: poll.questions,
    isActive: poll.isActive,
  });
});

app.get('/api/polls/:id', (req, res) => {
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  res.json(poll);
});

app.post('/api/polls', async (req, res) => {
  const { title, description, questions } = req.body || {};
  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: '标题和至少一个题目是必填的' });
  }
  const poll = {
    id: uuidv4(),
    shortCode: generateUniqueShortCode(),
    title,
    description: description || '',
    questions: questions.map((q, idx) => ({
      id: q.id || uuidv4(),
      type: q.type,
      title: q.title,
      options: q.options || undefined,
      order: q.order ?? idx,
    })),
    submissions: [],
    createdAt: Date.now(),
    isActive: true,
  };
  db.data.polls.push(poll);
  await db.write();
  res.status(201).json({ poll, shortCode: poll.shortCode });
});

app.patch('/api/polls/:id/close', async (req, res) => {
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  poll.isActive = false;
  poll.closedAt = Date.now();
  await db.write();
  io.emit('pollUpdate', poll);
  res.json(poll);
});

app.post('/api/polls/:id/questions', async (req, res) => {
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  const { type, title, options } = req.body || {};
  if (!type || !title) return res.status(400).json({ error: '题型和标题必填' });
  const newQuestion = {
    id: uuidv4(),
    type,
    title,
    options: options || undefined,
    order: poll.questions.length,
  };
  poll.questions.push(newQuestion);
  await db.write();
  io.emit('questionAdded', { pollId: poll.id, question: newQuestion });
  io.emit('pollUpdate', poll);
  res.json(poll);
});

app.get('/api/results/:pollId', (req, res) => {
  const poll = db.data.polls.find((p) => p.id === req.params.pollId);
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  const stats = buildResultStats(poll);
  res.json({ pollId: poll.id, stats, updatedAt: Date.now() });
});

app.get('/api/polls/:id/export', (req, res) => {
  const poll = db.data.polls.find((p) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: '投票不存在' });
  const headers = ['提交时间', ...poll.questions.map((q) => q.title)];
  const rows = poll.submissions.map((s) => {
    const row = [new Date(s.timestamp).toLocaleString('zh-CN')];
    poll.questions.forEach((q) => {
      const ans = s.answers[q.id];
      if (Array.isArray(ans)) row.push(ans.join('; '));
      else if (ans !== undefined) row.push(String(ans));
      else row.push('');
    });
    return row;
  });
  const escapeCsv = (v) => {
    const str = String(v ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const csv = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  const filename = encodeURIComponent(`${poll.title}_结果.csv`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.write('\uFEFF');
  res.end(csv);
});

io.on('connection', (socket) => {
  console.log(`[Socket] 客户端连接: ${socket.id}`);

  socket.on('newVote', async ({ pollId, answers }) => {
    const poll = db.data.polls.find((p) => p.id === pollId);
    if (!poll) {
      socket.emit('voteError', { error: '投票不存在' });
      return;
    }
    if (!poll.isActive) {
      socket.emit('voteError', { error: '投票已结束' });
      return;
    }
    const submission = {
      id: uuidv4(),
      timestamp: Date.now(),
      answers: answers || {},
    };
    poll.submissions.push(submission);
    await db.write();
    io.emit('pollUpdate', poll);
    socket.emit('voteSuccess', { submissionId: submission.id });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] 客户端断开: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`QuickVote 后端服务已启动: http://localhost:${PORT}`);
  console.log(`  - REST API: /api/*`);
  console.log(`  - WebSocket: /socket.io`);
  console.log(`  - 数据文件: ${dbFile}`);
});
