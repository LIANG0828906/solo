import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';

const router = Router();
const JWT_SECRET = 'library-secret-key-2024';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: '无效的令牌' });
  }
};

router.post('/register', (req: Request, res: Response) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = uuidv4();

  db.prepare(
    'INSERT INTO users (id, username, password, nickname, role) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, username, hashedPassword, nickname, 'user');

  const token = jwt.sign({ id: userId, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: userId, username, nickname, role: 'user' }
  });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }
  });
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, username, nickname, role FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user });
});

export { router as authRouter, AuthRequest };
