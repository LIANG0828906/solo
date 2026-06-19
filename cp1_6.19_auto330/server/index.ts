import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getLeaderboard(data: any) {
  return [...data.users]
    .sort((a: any, b: any) => b.points - a.points)
    .slice(0, 20)
    .map((u: any) => ({ userId: u.id, name: u.name, avatar: u.avatar, points: u.points }));
}

function calculatePoints(emission: number): number {
  let pts = 5;
  if (emission === 0) pts += 15;
  else if (emission < 2) pts += 10;
  else if (emission < 5) pts += 5;
  return pts;
}

app.get('/api/users', (_req, res) => {
  const data = readData();
  res.json(data.users);
});

app.get('/api/activities/:userId', (req, res) => {
  const data = readData();
  const activities = data.activities.filter((a: any) => a.userId === req.params.userId);
  res.json(activities);
});

app.get('/api/challenges', (_req, res) => {
  const data = readData();
  res.json(data.challenges);
});

app.get('/api/leaderboard', (_req, res) => {
  const data = readData();
  res.json(getLeaderboard(data));
});

app.get('/api/user-challenges/:userId', (req, res) => {
  const data = readData();
  const ucs = data.userChallenges.filter((uc: any) => uc.userId === req.params.userId);
  res.json(ucs);
});

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('user:login', (userId: string) => {
    socket.data.userId = userId;
    const data = readData();
    const user = data.users.find((u: any) => u.id === userId);
    const activities = data.activities.filter((a: any) => a.userId === userId);
    const userChallenges = data.userChallenges.filter((uc: any) => uc.userId === userId);

    socket.emit('init:data', {
      user,
      activities,
      challenges: data.challenges,
      userChallenges,
      leaderboard: getLeaderboard(data),
      categories: data.categories,
    });
  });

  socket.on('activity:create', (payload: {
    userId: string;
    category: string;
    subcategory: string;
    value: number;
    unit: string;
    emission: number;
  }) => {
    const data = readData();
    const activity = {
      id: uuidv4(),
      ...payload,
      timestamp: new Date().toISOString(),
    };
    data.activities.push(activity);

    const user = data.users.find((u: any) => u.id === payload.userId);
    let earnedPoints = 0;
    if (user) {
      earnedPoints = calculatePoints(payload.emission);
      user.points += earnedPoints;
    }

    const activeChallenges = data.userChallenges.filter(
      (uc: any) => uc.userId === payload.userId && !uc.completed,
    );
    let challengeCompleted = false;
    for (const uc of activeChallenges) {
      const challenge = data.challenges.find((c: any) => c.id === uc.challengeId);
      if (!challenge) continue;
      if (challenge.category !== payload.category && challenge.category !== 'all') continue;

      uc.progress += 1;
      if (uc.progress >= challenge.targetDays) {
        uc.completed = true;
        if (user) {
          user.points += challenge.points;
          earnedPoints += challenge.points;
          challengeCompleted = true;
        }
      }
    }

    writeData(data);

    socket.emit('activity:created', { activity, earnedPoints });
    io.emit('leaderboard:update', getLeaderboard(data));
    if (user) {
      io.emit('points:update', { userId: payload.userId, points: user.points });
    }
    io.emit('challenges:update', data.challenges);
    io.emit('userChallenges:update', {
      userId: payload.userId,
      userChallenges: data.userChallenges.filter((uc: any) => uc.userId === payload.userId),
    });
    if (challengeCompleted) {
      const completed = activeChallenges.filter((uc: any) => uc.completed);
      for (const uc of completed) {
        const ch = data.challenges.find((c: any) => c.id === uc.challengeId);
        if (ch) {
          io.emit('challenge:completed', { userId: payload.userId, challengeId: uc.challengeId, points: ch.points });
        }
      }
    }
  });

  socket.on('challenge:join', ({ userId, challengeId }: { userId: string; challengeId: string }) => {
    const data = readData();

    const existing = data.userChallenges.find(
      (uc: any) => uc.userId === userId && uc.challengeId === challengeId && !uc.completed,
    );
    if (existing) {
      socket.emit('challenge:joined', { challengeId, success: false, message: '已参加该挑战' });
      return;
    }

    const challenge = data.challenges.find((c: any) => c.id === challengeId);
    if (!challenge) return;

    challenge.participants += 1;
    const userChallenge = {
      id: uuidv4(),
      userId,
      challengeId,
      startDate: new Date().toISOString(),
      completed: false,
      progress: 0,
    };
    data.userChallenges.push(userChallenge);
    writeData(data);

    socket.emit('challenge:joined', { challengeId, success: true, userChallenge });
    io.emit('challenges:update', data.challenges);
    io.emit('userChallenges:update', {
      userId,
      userChallenges: data.userChallenges.filter((uc: any) => uc.userId === userId),
    });
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Carbon Tracker Server running on http://localhost:${PORT}`);
});
