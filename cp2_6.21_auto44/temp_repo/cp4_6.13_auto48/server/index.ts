import express from 'express';
import cors from 'cors';
import {
  initDB,
  createUser,
  getUserById,
  getUserByNickname,
  createItem,
  getAllItems,
  getItemById,
  getItemsByUserId,
  updateItemStatus,
  createExchangeRequest,
  getExchangeRequestsByUser,
  getExchangeRequestsByRequester,
  updateExchangeRequestStatus,
} from './db';

const app = express();
const PORT = 3099;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function start() {
  await initDB();

const apiRouter = express.Router();

apiRouter.post('/register', async (req, res) => {
  try {
    const { nickname, password } = req.body;
    if (!nickname || !password) {
      res.status(400).json({ error: '昵称和密码不能为空' });
      return;
    }
    const existing = await getUserByNickname(nickname);
    if (existing) {
      res.status(409).json({ error: '该昵称已被注册' });
      return;
    }
    const user = await createUser(nickname, password);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const user: any = await getUserByNickname(nickname);
    if (!user || user.password !== password) {
      res.status(401).json({ error: '昵称或密码错误' });
      return;
    }
    res.json({ id: user.id, nickname: user.nickname, avatar_color: user.avatar_color });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/items', async (req, res) => {
  try {
    const { user_id, title, description, category, image } = req.body;
    if (!user_id || !title || !description || !category) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    if (description.length > 200) {
      res.status(400).json({ error: '描述不能超过200字' });
      return;
    }
    const item = await createItem({ user_id, title, description, category, image });
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/items', async (_req, res) => {
  try {
    const items = await getAllItems();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/items/:id', async (req, res) => {
  try {
    const item = await getItemById(req.params.id);
    if (!item) {
      res.status(404).json({ error: '物品不存在' });
      return;
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/items/user/:userId', async (req, res) => {
  try {
    const items = await getItemsByUserId(req.params.userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/exchange-requests', async (req, res) => {
  try {
    const { item_id, requester_id, message } = req.body;
    if (!item_id || !requester_id || !message) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    if (message.length > 100) {
      res.status(400).json({ error: '留言不能超过100字' });
      return;
    }
    const request = await createExchangeRequest({ item_id, requester_id, message });
    res.status(201).json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/exchange-requests/owner/:userId', async (req, res) => {
  try {
    const requests = await getExchangeRequestsByUser(req.params.userId);
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/exchange-requests/requester/:userId', async (req, res) => {
  try {
    const requests = await getExchangeRequestsByRequester(req.params.userId);
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/exchange-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({ error: '无效状态' });
      return;
    }
    const updated = await updateExchangeRequestStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: '请求不存在' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

  app.use('/api', apiRouter);

  app.listen(PORT, () => {
    console.log(`☕ 咖啡角服务器运行在 http://localhost:${PORT}`);
  });
}

start();
