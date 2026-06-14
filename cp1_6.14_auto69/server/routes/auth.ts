import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import type { User } from '../types.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'heritage-secret-key';
const JWT_EXPIRES_IN = '7d';

interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

const signToken = (user: { id: string; username: string }): string => {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const verifyToken = (token: string): { id: string; username: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string };
  } catch {
    return null;
  }
};

const authenticate = (req: AuthRequest, res: Response): User | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }
  const user = db.data!.users.find((u) => u.id === decoded.id);
  if (!user) {
    return null;
  }
  return user;
};

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
      return;
    }

    if (username.trim().length < 2 || password.length < 4) {
      res.status(400).json({
        success: false,
        error: '用户名至少2位，密码至少4位',
      });
      return;
    }

    const existing = db.data!.users.find((u) => u.username === username.trim());
    if (existing) {
      res.status(409).json({
        success: false,
        error: '用户名已存在',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: uuidv4(),
      username: username.trim(),
      password: hashedPassword,
      favorites: [],
      createdAt: new Date().toISOString(),
    };

    db.data!.users.push(newUser);
    await db.write();

    const token = signToken({ id: newUser.id, username: newUser.username });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        favorites: newUser.favorites,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
    });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
      return;
    }

    const user = db.data!.users.find((u) => u.username === username.trim());
    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    const token = signToken({ id: user.id, username: user.username });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        favorites: user.favorites,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    });
  }
});

router.get('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = authenticate(req, res);
    if (!user) {
      res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        favorites: user.favorites,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    });
  }
});

router.post('/favorites/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = authenticate(req, res);
    if (!user) {
      res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
      return;
    }

    const { heritageId } = req.body as { heritageId?: string };
    if (!heritageId) {
      res.status(400).json({
        success: false,
        error: '缺少 heritageId 参数',
      });
      return;
    }

    const heritage = db.data!.heritage.find((h) => h.id === heritageId);
    if (!heritage) {
      res.status(404).json({
        success: false,
        error: '非遗项目不存在',
      });
      return;
    }

    const idx = user.favorites.indexOf(heritageId);
    let isFavorited: boolean;
    if (idx > -1) {
      user.favorites.splice(idx, 1);
      isFavorited = false;
    } else {
      user.favorites.push(heritageId);
      isFavorited = true;
    }

    await db.write();

    res.status(200).json({
      success: true,
      favorites: user.favorites,
      isFavorited,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '切换收藏状态失败',
    });
  }
});

export default router;
