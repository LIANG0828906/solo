import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../store/memoryStore.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function validatePassword(password) {
  if (password.length < 8) return '密码至少8位';
  if (!/[a-zA-Z]/.test(password)) return '密码必须包含字母';
  if (!/[0-9]/.test(password)) return '密码必须包含数字';
  return null;
}

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  if (store.findUserByUsername(username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = store.createUser({
    username,
    password: hashedPassword,
    nickname,
  });

  const token = store.createToken(user.id);

  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    bio: user.bio,
    token,
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const user = store.findUserByUsername(username);
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const token = store.createToken(user.id);

  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    bio: user.bio,
    token,
  });
});

router.get('/profile', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    bio: user.bio,
  });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { nickname, bio } = req.body;
  const user = store.updateUser(req.user.id, { nickname, bio });
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    bio: user.bio,
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  store.removeToken(req.token);
  res.json({ message: '登出成功' });
});

router.get('/:id/poems', (req, res) => {
  const { id } = req.params;
  const poems = store.getPoems({ userId: id });
  
  res.json(poems.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    authorId: p.authorId,
    authorName: p.authorName,
    tags: p.tags,
    likes: p.likes,
    comments: p.comments.length,
    createdAt: p.createdAt,
  })));
});

router.get('/liked/poems', authMiddleware, (req, res) => {
  const poems = store.getPoems({ likedBy: req.user.id });
  
  res.json(poems.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    authorId: p.authorId,
    authorName: p.authorName,
    tags: p.tags,
    likes: p.likes,
    comments: p.comments.length,
    createdAt: p.createdAt,
  })));
});

export default router;
