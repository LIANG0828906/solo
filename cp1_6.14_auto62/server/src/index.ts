import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import {
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
  createChallenge,
  getAllChallenges,
  findChallengeById,
  joinChallenge,
  createDailyRecord,
  getDailyRecordsByUserAndChallenge,
  getDailyRecordsByChallenge,
  getDailyRecordsByUser,
  getTodayRecord,
  getUserLatestRecord,
  getUserChallenges,
  User,
  Challenge,
  DailyRecord,
} from './models.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'fitness-challenge-secret-key-2024';

app.use(cors());
app.use(express.json());

export interface AuthRequest extends Request {
  user?: User;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未授权' });
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    findUserById(decoded.userId).then(user => {
      if (!user) {
        res.status(401).json({ error: '用户不存在' });
        return;
      }
      req.user = user;
      next();
    });
  } catch {
    res.status(401).json({ error: '无效的token' });
  }
}

function excludePassword(user: User) {
  const { password, ...rest } = user;
  return rest;
}

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nickname, avatar } = req.body;
    if (!email || !password || !nickname) {
      res.status(400).json({ error: '邮箱、密码和昵称不能为空' });
      return;
    }
    const user = await createUser(email, password, nickname, avatar);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: excludePassword(user), token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: '邮箱和密码不能为空' });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }
    const valid = await verifyPassword(user, password);
    if (!valid) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: excludePassword(user), token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (req.user) {
    res.json({ user: excludePassword(req.user) });
  }
});

app.get('/api/challenges', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const challenges = await getAllChallenges();
    const enriched = await Promise.all(
      challenges.map(async (c) => {
        let myLatest: DailyRecord | null = null;
        if (req.user) {
          myLatest = await getUserLatestRecord(req.user.id, c.id);
        }
        return { ...c, myLatestCount: myLatest?.count || 0, participantsCount: c.participantIds.length };
      })
    );
    res.json({ challenges: enriched });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/challenges', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, duration, dailyGoal, unit, startDate, inviteCode } = req.body;
    if (!name || !duration || !dailyGoal || !unit || !startDate) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }
    const challenge = await createChallenge(
      name,
      duration,
      dailyGoal,
      unit,
      startDate,
      req.user.id,
      inviteCode
    );
    res.json({ challenge });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/challenges/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await findChallengeById(id);
    if (!challenge) {
      res.status(404).json({ error: '挑战不存在' });
      return;
    }
    const participants = await Promise.all(
      challenge.participantIds.map(async (uid) => {
        const u = await findUserById(uid);
        return u ? excludePassword(u) : null;
      })
    );
    const validParticipants = participants.filter(Boolean);
    
    const records = await getDailyRecordsByChallenge(id);
    const leaderboard = validParticipants.map(p => {
      const userRecords = records.filter(r => r.userId === p!.id);
      const total = userRecords.reduce((sum, r) => sum + r.count, 0);
      return { user: p, total, records: userRecords.length };
    }).sort((a, b) => b.total - a.total);

    let myRecords: DailyRecord[] = [];
    let myToday: DailyRecord | null = null;
    if (req.user) {
      myRecords = await getDailyRecordsByUserAndChallenge(req.user.id, id);
      myToday = await getTodayRecord(req.user.id, id);
    }

    const isJoined = req.user ? challenge.participantIds.includes(req.user.id) : false;

    res.json({
      challenge,
      participants: validParticipants,
      leaderboard,
      myRecords,
      myToday,
      isJoined,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/challenges/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params