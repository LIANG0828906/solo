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
  getLast30DaysRecords,
  getLeaderboardWithRank,
  User,
  Challenge,
  DailyRecord,
  validateEmail,
  validatePassword,
} from './models.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'fitness-challenge-secret-key-2024';

app.use(cors());
app.use(express.json());

export interface AuthRequest extends Request {
  user?: User;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
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
    
    if (!validateEmail(email)) {
      res.status(400).json({ error: '邮箱格式不正确' });
      return;
    }
    
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({ error: passwordCheck.message });
      return;
    }
    
    if (nickname.trim().length < 2) {
      res.status(400).json({ error: '昵称长度至少2位' });
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
      name.trim(),
      duration,
      Number(dailyGoal),
      unit.trim(),
      startDate,
      req.user.id,
      inviteCode?.trim() || undefined
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
    const validParticipants = participants.filter(Boolean) as Array<Omit<User, 'password'>>;
    
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
      leaderboard: leaderboard.slice(0, 20),
      myRecords,
      myToday,
      isJoined,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/challenges/:id/leaderboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const startTime = Date.now();
    
    const leaderboardData = await getLeaderboardWithRank(id);
    
    const leaderboard = leaderboardData
      .filter(item => item.user !== null)
      .map(item => ({
        user: item.user ? excludePassword(item.user) : null,
        total: item.total,
        currentRank: item.currentRank,
        previousRank: item.previousRank,
      }))
      .slice(0, 20);
    
    const elapsed = Date.now() - startTime;
    if (elapsed > 300) {
      console.warn(`Leaderboard query took ${elapsed}ms, exceeds 300ms target`);
    }
    
    res.json({ 
      leaderboard,
      timestamp: new Date().toISOString(),
      responseTime: elapsed,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/challenges/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { inviteCode } = req.body;
    
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }
    
    const challenge = await joinChallenge(id, req.user.id, inviteCode);
    res.json({ challenge });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/challenges/:id/records', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { count, date } = req.body;
    
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }
    
    if (count === undefined || count === null) {
      res.status(400).json({ error: '完成数量不能为空' });
      return;
    }
    
    const recordDate = date || new Date().toISOString().split('T')[0];
    const record = await createDailyRecord(req.user.id, id, recordDate, Number(count));
    res.json({ record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/challenges/:id/records', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }
    const records = await getDailyRecordsByUserAndChallenge(req.user.id, id);
    res.json({ records });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/user/challenges', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }
    const challenges = await getUserChallenges(req.user.id);
    
    const challengesWithRecords = await Promise.all(
      challenges.map(async (c) => {
        const records = await getDailyRecordsByUserAndChallenge(req.user!.id, c.id);
        const total = records.reduce((sum, r) => sum + r.count, 0);
        return { ...c, total, recordsCount: records.length };
      })
    );
    
    res.json({ challenges: challengesWithRecords });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/user/records/last30days', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }
    const records = await getLast30DaysRecords(req.user.id);
    
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29);
    
    const dailyData: Array<{ date: string; total: number; challenges: Record<string, number> }> = [];
    
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = records.filter(r => r.date === dateStr);
      const challenges: Record<string, number> = {};
      
      dayRecords.forEach(r => {
        if (!challenges[r.challengeId]) {
          challenges[r.challengeId] = 0;
        }
        challenges[r.challengeId] += r.count;
      });
      
      const total = Object.values(challenges).reduce((sum, v) => sum + v, 0);
      
      dailyData.push({
        date: dateStr,
        total,
        challenges,
      });
    }
    
    res.json({ records: dailyData });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/user/records', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }
    const records = await getDailyRecordsByUser(req.user.id);
    res.json({ records });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { app };
