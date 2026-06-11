
import { Router, Request, Response } from 'express';
import { WalnutService } from '../services/WalnutService.js';
import { AuthService } from '../services/AuthService.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const walnuts = WalnutService.getAllWalnuts();
  const cleanWalnuts = walnuts.map(w => {
    const { ...rest } = w;
    return rest;
  });
  res.json(cleanWalnuts);
});

router.get('/market', (_req: Request, res: Response) => {
  const walnuts = WalnutService.getMarketWalnuts();
  res.json(walnuts);
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const walnut = WalnutService.getWalnutById(id);
  
  if (!walnut) {
    return res.status(404).json({ message: '核桃不存在' });
  }

  res.json(walnut);
});

router.post('/:id/buy', (req: Request, res: Response) => {
  const { id } = req.params;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }

  const user = AuthService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }

  const result = WalnutService.buyWalnut(id, user.id);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  res.json({ message: result.message, walnut: result.walnut, user: result.user });
});

export default router;
