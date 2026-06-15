import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  initDatabase,
  getAllSkills,
  getSkillById,
  createExchange,
  getExchangesByUserId,
  updateExchangeStatus,
  getSchedule,
  createReview,
  getReviewByExchangeAndReviewer,
  registerUser,
  getUserById,
  Exchange,
} from './database.js';

initDatabase();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/skills', (req: Request, res: Response) => {
  const { category, lat, lng } = req.query;
  const skills = getAllSkills(
    category as string | undefined,
    lat ? parseFloat(lat as string) : undefined,
    lng ? parseFloat(lng as string) : undefined
  );
  res.json(skills);
});

app.get('/api/skills/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const skill = getSkillById(id);
  if (!skill) {
    res.status(404).json({ error: '技能不存在' });
    return;
  }
  res.json(skill);
});

app.post('/api/exchanges', (req: Request, res: Response) => {
  try {
    const { skillId, fromUserId, toUserId, scheduledDate, startTime, endTime } = req.body;
    if (!skillId || !fromUserId || !toUserId || !scheduledDate || startTime == null || endTime == null) {
      res.status(400).json({ error: '缺少必要字段' });
      return;
    }
    const exchange = createExchange({
      skillId, fromUserId, toUserId, scheduledDate, startTime, endTime
    } as Omit<Exchange, 'id' | 'createdAt' | 'status'>);
    res.status(201).json(exchange);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/exchanges', (req: Request, res: Response) => {
  const userId = parseInt(req.query.userId as string);
  if (!userId) {
    res.status(400).json({ error: '缺少userId参数' });
    return;
  }
  res.json(getExchangesByUserId(userId));
});

app.patch('/api/exchanges/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const validStatuses: Exchange['status'][] = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: '无效状态' });
    return;
  }
  const exchange = updateExchangeStatus(id, status);
  if (!exchange) {
    res.status(404).json({ error: '交换不存在' });
    return;
  }
  res.json(exchange);
});

app.get('/api/schedule', (req: Request, res: Response) => {
  const userId = parseInt(req.query.userId as string);
  const month = parseInt((req.query.month as string) || String(new Date().getMonth() + 1));
  const year = parseInt((req.query.year as string) || String(new Date().getFullYear()));
  if (!userId) {
    res.status(400).json({ error: '缺少userId参数' });
    return;
  }
  res.json(getSchedule(userId, month, year));
});

app.post('/api/reviews', (req: Request, res: Response) => {
  try {
    const { exchangeId, reviewerId, revieweeId, rating, comment } = req.body;
    if (!exchangeId || !reviewerId || !revieweeId || !rating) {
      res.status(400).json({ error: '缺少必要字段' });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: '评分必须在1-5之间' });
      return;
    }
    createReview({ exchangeId, reviewerId, revieweeId, rating, comment: comment || '' });
    res.status(201).json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/reviews/check', (req: Request, res: Response) => {
  const exchangeId = parseInt(req.query.exchangeId as string);
  const reviewerId = parseInt(req.query.reviewerId as string);
  if (!exchangeId || !reviewerId) {
    res.status(400).json({ error: '缺少参数' });
    return;
  }
  const review = getReviewByExchangeAndReviewer(exchangeId, reviewerId);
  res.json({ reviewed: !!review, review });
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = getUserById(id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json(user);
});

app.post('/api/users/register', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: '请输入昵称' });
    return;
  }
  const user = registerUser(name.trim());
  res.status(201).json(user);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`技能交换平台后端运行在 http://localhost:${PORT}`);
});
