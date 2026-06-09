import type { Request, Response } from 'express';
import { usersService } from '../services/users.service';

export const authController = {
  register: (req: Request, res: Response): void => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.status(400).json({ success: false, error: '用户名和密码不能为空' });
        return;
      }
      
      const result = usersService.register(username, password);
      
      if ('error' in result) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }
      
      res.json({ success: true, user: result.user, token: result.token });
    } catch (error) {
      res.status(500).json({ success: false, error: '服务器错误' });
    }
  },
  
  login: (req: Request, res: Response): void => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.status(400).json({ success: false, error: '用户名和密码不能为空' });
        return;
      }
      
      const result = usersService.login(username, password);
      
      if ('error' in result) {
        res.status(401).json({ success: false, error: result.error });
        return;
      }
      
      res.json({ success: true, user: result.user, token: result.token });
    } catch (error) {
      res.status(500).json({ success: false, error: '服务器错误' });
    }
  },
};
