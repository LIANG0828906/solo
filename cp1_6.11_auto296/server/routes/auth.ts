
import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '藏家名和密码不能为空' });
  }

  const result = AuthService.register(username, password);
  
  if (!result) {
    return res.status(400).json({ message: '该藏家名已被注册' });
  }

  res.json(result);
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '藏家名和密码不能为空' });
  }

  const result = AuthService.login(username, password);
  
  if (!result) {
    return res.status(401).json({ message: '藏家名或密码错误' });
  }

  res.json(result);
});

export default router;
