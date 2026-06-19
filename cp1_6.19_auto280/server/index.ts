import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import ingredientRouter, { setPool as setIngredientPool } from './routes/ingredients.js';
import chatRouter, { setPool as setChatPool, setupSocket } from './routes/chat.js';
import { authMiddleware } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: '*' } });

const JWT_SECRET = process.env.JWT_SECRET || 'neighborhood-secret-key';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ingredient_share';

app.use(cors());
app.use(express.json());

let pool: Pool | null = null;

async function initDatabase() {
  try {
    pool = new Pool({ connectionString: DATABASE_URL });
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL 连接成功');

    const initSql = fs.readFileSync(path.resolve(__dirname, '../db/init.sql'), 'utf8');
    await pool.query(initSql);
    console.log('✅ 数据库表初始化完成');
  } catch (err) {
    console.warn('⚠️ PostgreSQL 连接失败，将使用内存数据:', (err as Error).message);
    pool = null;
  }

  setIngredientPool(pool);
  setChatPool(pool);
}

const authRouter = express.Router();

authRouter.post('/register', async (req: express.Request, res: express.Response) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    if (pool) {
      const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (existing.rows.length > 0) {
        res.status(409).json({ error: '用户名已存在' });
        return;
      }
      const result = await pool.query(
        'INSERT INTO users (username, password_hash, nickname) VALUES ($1, $2, $3) RETURNING id, username, nickname, avatar_color',
        [username, password_hash, nickname]
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user });
    } else {
      res.status(503).json({ error: '数据库不可用，无法注册' });
    }
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '注册失败' });
  }
});

authRouter.post('/login', async (req: express.Request, res: express.Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        res.status(401).json({ error: '用户名或密码错误' });
        return;
      }
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: '用户名或密码错误' });
        return;
      }
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: { id: user.id, username: user.username, nickname: user.nickname, avatar_color: user.avatar_color },
      });
    } else {
      res.status(503).json({ error: '数据库不可用，无法登录' });
    }
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

const trustRouter = express.Router();

trustRouter.post('/:userId', authMiddleware, async (req: express.Request, res: express.Response) => {
  const toUserId = req.params.userId;
  const fromUserId = req.user!.id;

  if (fromUserId === toUserId) {
    res.status(400).json({ error: '不能信任自己' });
    return;
  }

  try {
    if (pool) {
      const existing = await pool.query(
        'SELECT id FROM trust_marks WHERE from_user_id = $1 AND to_user_id = $2',
        [fromUserId, toUserId]
      );
      if (existing.rows.length > 0) {
        res.status(409).json({ error: '已经信任过该用户' });
        return;
      }
      await pool.query('INSERT INTO trust_marks (from_user_id, to_user_id) VALUES ($1, $2)', [fromUserId, toUserId]);
      await pool.query('UPDATE users SET trust_count = trust_count + 1 WHERE id = $1', [toUserId]);
      res.status(201).json({ message: '信任标记成功' });
    } else {
      res.status(503).json({ error: '数据库不可用' });
    }
  } catch (err) {
    console.error('信任标记失败:', err);
    res.status(500).json({ error: '信任标记失败' });
  }
});

trustRouter.get('/:userId', async (req: express.Request, res: express.Response) => {
  const userId = req.params.userId;

  try {
    if (pool) {
      const result = await pool.query('SELECT COUNT(*)::int AS count FROM trust_marks WHERE to_user_id = $1', [userId]);
      res.json({ userId, trustCount: result.rows[0].count });
    } else {
      res.status(503).json({ error: '数据库不可用' });
    }
  } catch (err) {
    console.error('获取信任数失败:', err);
    res.status(500).json({ error: '获取信任数失败' });
  }
});

app.use('/api/ingredients', ingredientRouter);
app.use('/api/chats', chatRouter);
app.use('/api/auth', authRouter);
app.use('/api/trust', trustRouter);

setupSocket(io);

const PORT = 3001;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  });
});
