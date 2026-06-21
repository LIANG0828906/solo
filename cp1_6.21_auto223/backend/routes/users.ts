import { Router, Request, Response } from 'express';
import { store, genId } from '../store';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (store.users.some((u) => u.username === username)) {
    return res.status(409).json({ error: '用户名已存在' });
  }
  const user = {
    id: genId(),
    username,
    password,
    avatar: username.charAt(0).toUpperCase(),
  };
  store.users.push(user);
  const { password: _, ...safe } = user;
  res.status(201).json(safe);
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = store.users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const { password: _, ...safe } = user;
  res.json(safe);
});

router.get('/', (_req: Request, res: Response) => {
  const users = store.users.map(({ password: _, ...u }) => u);
  res.json(users);
});

export default router;
