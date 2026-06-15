import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createJsonRepository } from '../utils/jsonFileRepository';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: string;
}

const router = Router();
const userRepo = createJsonRepository<User>('users.json');

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const users = await userRepo.read();
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, error: '邮箱已注册' });
    }
    
    const newUser: User = {
      id: uuidv4(),
      username,
      email,
      password,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    
    await userRepo.add(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.json({
      success: true,
      data: { user: userWithoutPassword, token: `token_${newUser.id}` },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const users = await userRepo.read();
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ success: false, error: '邮箱或密码错误' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: { user: userWithoutPassword, token: `token_${user.id}` },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

export default router;
