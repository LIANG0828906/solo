import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'recipe-app-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

const getUserByUsernameStmt = db.prepare('SELECT * FROM user WHERE username = ?');
const getUserByEmailStmt = db.prepare('SELECT * FROM user WHERE email = ?');
const insertUserStmt = db.prepare(
  'INSERT INTO user (username, email, password_hash) VALUES (?, ?, ?)'
);

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar: string | null;
  created_at: string;
}

export function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    const existingUser = getUserByUsernameStmt.get(username) as User | undefined;
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const existingEmail = getUserByEmailStmt.get(email) as User | undefined;
    if (existingEmail) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = insertUserStmt.run(username, email, passwordHash);
    const userId = result.lastInsertRowid as number;

    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: userId, username, email },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
}

export function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请填写用户名和密码' });
    }

    const user = getUserByUsernameStmt.get(username) as User | undefined;
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }
}

export function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const user = db.prepare('SELECT id, username, email, avatar FROM user WHERE id = ?').get(req.user.id) as { id: number; username: string; email: string; avatar: string | null } | undefined;

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user);
}
