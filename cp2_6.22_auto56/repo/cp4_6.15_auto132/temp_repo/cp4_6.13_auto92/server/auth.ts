import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = 'craft_workshop_secret_key_2024';

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

export const generateToken = (user: JwtPayload): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: '无效或过期的令牌' });
    return;
  }
  (req as any).user = payload;
  next();
};

export const instructorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as JwtPayload;
  if (!user || user.role !== 'instructor') {
    res.status(403).json({ error: '需要手工艺人权限' });
    return;
  }
  next();
};
