import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface User {
  id: string;
  username: string;
}

const users = new Map<string, { username: string; password: string; id: string }>();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    return;
  }

  let user = users.get(username);
  if (!user) {
    const id = uuidv4();
    user = { username, password, id };
    users.set(username, user);
  } else if (user.password !== password) {
    res.status(401).json({ success: false, error: '密码错误' });
    return;
  }

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    return;
  }

  if (users.has(username)) {
    res.status(409).json({ success: false, error: '用户名已存在' });
    return;
  }

  const id = uuidv4();
  users.set(username, { username, password, id });

  res.json({
    success: true,
    user: { id, username },
  });
});

export default router;
