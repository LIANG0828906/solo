import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'beantrace-secret-key-2024';

interface AuthRequest extends Express.Request {
  userId?: string;
}

export function authenticateToken(req: AuthRequest, res: Express.Response, next: Express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }
    (req as any).userId = user.id;
    next();
  });
}

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    return res.status(400).json({ error: '用户名或邮箱已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  db.prepare('INSERT INTO users (id, username, email, password, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(id, username, email, hashedPassword, createdAt);

  const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    token,
    user: { id, username, email, createdAt },
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请填写用户名和密码' });
  }

  const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
  });
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  const user: any = db.prepare('SELECT id, username, email, createdAt FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

export default router;
