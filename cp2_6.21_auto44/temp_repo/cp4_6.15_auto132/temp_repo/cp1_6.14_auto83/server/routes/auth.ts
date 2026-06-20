import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pixelvault-secret-key-2024';

export function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
  } catch {
    return null;
  }
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' });
      return;
    }
    const db = await getDb();
    if (db.data.users.find(u => u.username === username)) {
      res.status(409).json({ success: false, error: '用户名已存在' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuid(),
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.data.users.push(user);
    await db.write();
    const token = generateToken(user.id, user.username);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' });
      return;
    }
    const db = await getDb();
    const user = db.data.users.find(u => u.username === username);
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }
    const token = generateToken(user.id, user.username);
    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

export default router;
