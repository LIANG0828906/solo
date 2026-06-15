import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  getUserByUsername,
  createUser,
  getUserById,
  updateUserPoints,
} from './database';

const router = Router();
const JWT_SECRET = 'skill-exchange-secret-key-2024';

interface AuthRequest extends Request {
  userId?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: Function): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Token 无效' });
      return;
    }
    (req as AuthRequest).userId = user.userId;
    next();
  });
}

router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const existingUser = getUserByUsername(username);
  if (existingUser) {
    res.status(409).json({ error: '用户名已存在' });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const user = createUser({
    id: uuidv4(),
    username,
    password: hashedPassword,
    avatar: avatarColor,
    points: 50,
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      points: user.points,
    },
  });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const user = getUserByUsername(username);
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      points: user.points,
    },
  });
});

router.get('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const user = getUserById(userId);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    points: user.points,
  });
});

router.put('/points', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const { points } = req.body;
  updateUserPoints(userId, points);

  const user = getUserById(userId);
  res.json({
    id: user!.id,
    username: user!.username,
    avatar: user!.avatar,
    points: user!.points,
  });
});

export default router;
