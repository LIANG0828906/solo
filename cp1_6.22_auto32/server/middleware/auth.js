import { store } from '../store/memoryStore.js';

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  const user = store.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: '登录已过期' });
  }

  req.user = user;
  req.token = token;
  next();
}
