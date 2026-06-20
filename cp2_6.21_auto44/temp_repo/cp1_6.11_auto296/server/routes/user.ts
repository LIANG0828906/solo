
import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { UserService } from '../services/UserService.js';

const router = Router();

router.get('/profile', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }

  const user = AuthService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }

  const profile = UserService.getProfile(user.id);
  res.json(profile);
});

router.get('/favorites', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }

  const user = AuthService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }

  const favorites = UserService.getFavorites(user.id);
  res.json(favorites);
});

router.post('/favorites/:id', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.params;
  
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }

  const user = AuthService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }

  const success = UserService.addFavorite(user.id, id);
  if (!success) {
    return res.status(400).json({ message: '收藏失败' });
  }

  const profile = UserService.getProfile(user.id);
  res.json({ message: '收藏成功', user: profile });
});

router.delete('/favorites/:id', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.params;
  
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }

  const user = AuthService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }

  const success = UserService.removeFavorite(user.id, id);
  if (!success) {
    return res.status(400).json({ message: '取消收藏失败' });
  }

  const profile = UserService.getProfile(user.id);
  res.json({ message: '已取消收藏', user: profile });
});

router.post('/favorites/sync', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { favorites } = req.body;
  
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }

  const user = AuthService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }

  const success = UserService.syncFavorites(user.id, favorites || []);
  if (!success) {
    return res.status(400).json({ message: '同步失败' });
  }

  const updatedFavorites = UserService.getFavorites(user.id);
  res.json({ message: '同步成功', favorites: updatedFavorites });
});

export default router;
