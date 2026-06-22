import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = Router();

const SECRET_KEY = 'doc-collab-secret-key-2024';

interface UserRecord {
  id: string;
  username: string;
  password: string;
  avatar: string;
}

interface TokenPayload {
  id: string;
  username: string;
  iat: number;
  exp: number;
}

const users: UserRecord[] = [
  { id: '1', username: 'admin', password: 'admin123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' },
  { id: '2', username: 'zhangsan', password: '123456', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan' },
  { id: '3', username: 'lisi', password: '123456', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi' }
];

function createToken(payload: { id: string; username: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: '令牌无效或已过期' });
    return;
  }
  req.user = payload;
  next();
}

export { users, createToken };

router.post('/auth/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  if (users.find(u => u.username === username)) {
    res.status(409).json({ error: '用户名已存在' });
    return;
  }
  const user: UserRecord = {
    id: uuidv4(),
    username,
    password,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  };
  users.push(user);
  const token = createToken({ id: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } });
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  const token = createToken({ id: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } });
});

export default router;
