import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../memoryStore';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth';
import { getPool } from '../db';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ message: '请填写完整信息' });
  }
  const pool = getPool();
  try {
    if (pool) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: '邮箱已被注册' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
        [email, hashedPassword, username]
      );
      const token = generateToken(result.rows[0].id);
      return res.json({ token, user: result.rows[0] });
    }
  } catch (e) {}

  const existing = store.users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ message: '邮箱已被注册' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: store.nextId.users++,
    email,
    password: hashedPassword,
    username,
    created_at: new Date().toISOString(),
  };
  store.users.push(newUser);
  const token = generateToken(newUser.id);
  res.json({ token, user: { id: newUser.id, email: newUser.email, username: newUser.username } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: '请填写邮箱和密码' });
  }
  const pool = getPool();
  let user: any = null;
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    }
  } catch (e) {}

  if (!user) {
    user = store.users.find(u => u.email === email);
  }
  if (!user) {
    return res.status(400).json({ message: '邮箱或密码错误' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ message: '邮箱或密码错误' });
  }
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const pool = getPool();
  let user: any = null;
  try {
    if (pool) {
      const result = await pool.query('SELECT id, email, username FROM users WHERE id = $1', [req.userId]);
      user = result.rows[0];
    }
  } catch (e) {}
  if (!user) {
    user = store.users.find(u => u.id === req.userId);
  }
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  res.json({ id: user.id, email: user.email, username: user.username });
});

router.get('/exchanges', authMiddleware, async (req: AuthRequest, res) => {
  const pool = getPool();
  try {
    if (pool) {
      const result = await pool.query(
        `SELECT e.*, b.title as book_title, 
          u1.username as requester_name, 
          u2.username as owner_name
         FROM exchanges e 
         JOIN books b ON e.book_id = b.id
         JOIN users u1 ON e.requester_id = u1.id
         JOIN users u2 ON e.owner_id = u2.id
         WHERE e.requester_id = $1 OR e.owner_id = $1
         ORDER BY e.created_at DESC`,
        [req.userId]
      );
      return res.json(result.rows);
    }
  } catch (e) {}

  const exchanges = store.exchanges
    .filter(e => e.requester_id === req.userId || e.owner_id === req.userId)
    .map(e => {
      const book = store.books.find(b => b.id === e.book_id);
      const requester = store.users.find(u => u.id === e.requester_id);
      const owner = store.users.find(u => u.id === e.owner_id);
      return {
        ...e,
        book_title: book?.title,
        requester_name: requester?.username,
        owner_name: owner?.username,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(exchanges);
});

router.put('/exchanges/:id/accept', authMiddleware, async (req: AuthRequest, res) => {
  const exchangeId = parseInt(req.params.id);
  const pool = getPool();
  try {
    if (pool) {
      const ex = await pool.query('SELECT * FROM exchanges WHERE id = $1', [exchangeId]);
      if (!ex.rows[0] || ex.rows[0].owner_id !== req.userId) {
        return res.status(403).json({ message: '无权限' });
      }
      await pool.query("UPDATE exchanges SET status = 'accepted' WHERE id = $1", [exchangeId]);
      await pool.query("UPDATE books SET status = 'completed' WHERE id = $1", [ex.rows[0].book_id]);
      return res.json({ message: '已同意交换' });
    }
  } catch (e) {}

  const exchange = store.exchanges.find(e => e.id === exchangeId);
  if (!exchange || exchange.owner_id !== req.userId) {
    return res.status(403).json({ message: '无权限' });
  }
  exchange.status = 'accepted';
  const book = store.books.find(b => b.id === exchange.book_id);
  if (book) book.status = 'completed';
  res.json({ message: '已同意交换' });
});

export default router;
