import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Poll, CreatePollRequest, SubmitVoteRequest } from '../src/types';
import { calculateSchedule } from '../src/utils/scheduler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Database {
  polls: Poll[];
}

const defaultData: Database = { polls: [] };
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile<Database>(file);
const db = new Low<Database>(adapter, defaultData);

await db.read();
if (!db.data.polls) {
  db.data.polls = [];
  await db.write();
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function generateShortId(): string {
  return uuidv4().slice(0, 8);
}

app.get('/api/polls', async (_req, res) => {
  await db.read();
  res.json(db.data.polls);
});

app.get('/api/polls/:id', async (req, res) => {
  await db.read();
  const poll = db.data.polls.find(
    (p) => p.id === req.params.id || p.shortId === req.params.id
  );
  if (!poll) {
    res.status(404).json({ error: '投票不存在' });
    return;
  }
  res.json(poll);
});

app.post('/api/polls', async (req, res) => {
  const body = req.body as CreatePollRequest;

  if (!body.title || !body.options || body.options.length === 0 || !body.deadline) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  await db.read();

  const members = body.members.map((m) => ({
    id: uuidv4(),
    name: m.name,
    avatar: m.avatar,
  }));

  const poll: Poll = {
    id: uuidv4(),
    shortId: generateShortId(),
    title: body.title,
    options: body.options.map((opt) => ({
      id: uuidv4(),
      date: opt.date,
      startTime: opt.startTime,
      endTime: opt.endTime,
    })),
    deadline: body.deadline,
    createdAt: new Date().toISOString(),
    creatorName: body.creatorName,
    votes: [],
    members,
  };

  db.data.polls.push(poll);
  await db.write();

  res.status(201).json(poll);
});

app.post('/api/polls/:id/vote', async (req, res) => {
  const body = req.body as SubmitVoteRequest;

  await db.read();
  const pollIndex = db.data.polls.findIndex(
    (p) => p.id === req.params.id || p.shortId === req.params.id
  );

  if (pollIndex === -1) {
    res.status(404).json({ error: '投票不存在' });
    return;
  }

  const poll = db.data.polls[pollIndex];

  if (new Date(poll.deadline) < new Date()) {
    res.status(400).json({ error: '投票已截止' });
    return;
  }

  const existingVoteIndex = poll.votes.findIndex((v) => v.memberId === body.memberId);
  const newVote = {
    memberId: body.memberId,
    memberName: body.memberName,
    avatar: body.avatar,
    preferences: body.preferences,
    votedAt: new Date().toISOString(),
  };

  if (existingVoteIndex >= 0) {
    poll.votes[existingVoteIndex] = newVote;
  } else {
    poll.votes.push(newVote);
  }

  db.data.polls[pollIndex] = poll;
  await db.write();

  res.json(poll);
});

app.get('/api/schedule/:pollId', async (req, res) => {
  await db.read();
  const poll = db.data.polls.find(
    (p) => p.id === req.params.pollId || p.shortId === req.params.pollId
  );

  if (!poll) {
    res.status(404).json({ error: '投票不存在' });
    return;
  }

  const result = calculateSchedule(poll);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
