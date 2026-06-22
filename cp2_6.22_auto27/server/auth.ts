import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { createUser, getUserByUsername, getUserByEmail, getUserById, type User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: User;
}

export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    const { password: _password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword as User;
    next();
  } catch {
    res.status(403).json({ error: '无效的认证令牌' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: '用户名、邮箱和密码都是必填项' });
    return;
  }

  if (username.length < 2 || username.length > 20) {
    res.status(400).json({ error: '用户名长度应为2-20个字符' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: '密码长度至少为6个字符' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: '邮箱格式不正确' });
    return;
  }

  const existingUser = getUserByUsername(username);
  if (existingUser) {
    res.status(400).json({ error: '用户名已被占用' });
    return;
  }

  const existingEmail = getUserByEmail(email);
  if (existingEmail) {
    res.status(400).json({ error: '邮箱已被注册' });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = createUser(username, email, hashedPassword);
    const token = generateToken(userId);
    const user = getUserById(userId);

    if (!user) {
      res.status(500).json({ error: '创建用户失败' });
      return;
    }

    const { password: _password, ...userWithoutPassword } = user;
    res.status(201).json({
      token,
      user: userWithoutPassword,
    });
  } catch {
    res.status(500).json({ error: '注册失败，请重试' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码都是必填项' });
    return;
  }

  const user = getUserByUsername(username);
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  try {
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken(user.id);
    const { password: _password, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch {
    res.status(500).json({ error: '登录失败，请重试' });
  }
};

export const getCurrentUser = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  res.json({ user: req.user });
};
