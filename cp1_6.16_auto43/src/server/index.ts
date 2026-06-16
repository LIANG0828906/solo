import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { SeedItem, ExchangeRequest, User, Stats } from '../types';

const app = express();
const PORT = 45678;

app.use(cors());
app.use(express.json());

const users: User[] = [];
const seedItems: SeedItem[] = [];
const exchangeRequests: ExchangeRequest[] = [];

const getTodayStart = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

app.post('/api/login', (req: Request, res: Response) => {
  const { nickname } = req.body;
  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({ error: '昵称不能为空' });
  }
  const existingUser = users.find(u => u.nickname === nickname);
  if (!existingUser) {
    users.push({ nickname, createdAt: Date.now() });
  }
  res.json({ success: true, nickname });
});

app.get('/api/items', (req: Request, res: Response) => {
  const { search, variety, location, minQuantity, maxQuantity } = req.query;
  let filtered = [...seedItems];
  if (search && typeof search === 'string') {
    filtered = filtered.filter(item =>
      item.seedName.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (variety && typeof variety === 'string' && variety !== 'all') {
    filtered = filtered.filter(item => item.variety === variety);
  }
  if (location && typeof location === 'string' && location !== 'all') {
    filtered = filtered.filter(item => item.location === location);
  }
  if (minQuantity) {
    const min = parseInt(minQuantity as string);
    filtered = filtered.filter(item => item.quantity >= min);
  }
  if (maxQuantity) {
    const max = parseInt(maxQuantity as string);
    filtered = filtered.filter(item => item.quantity <= max);
  }
  res.json(filtered.sort((a, b) => b.createdAt - a.createdAt));
});

app.get('/api/items/varieties', (_req: Request, res: Response) => {
  const varieties = Array.from(new Set(seedItems.map(item => item.variety)));
  res.json(varieties);
});

app.get('/api/items/locations', (_req: Request, res: Response) => {
  const locations = Array.from(new Set(seedItems.map(item => item.location)));
  res.json(locations);
});

app.post('/api/items', (req: Request, res: Response) => {
  const { ownerNickname, seedName, variety, quantity, expectedExchange, photoUrl, location } = req.body;
  if (!ownerNickname || !seedName || !variety || !quantity || !expectedExchange || !location) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const newItem: SeedItem = {
    id: uuidv4(),
    ownerNickname,
    seedName,
    variety,
    quantity: parseInt(quantity),
    expectedExchange,
    photoUrl: photoUrl || '',
    location,
    createdAt: Date.now(),
  };
  seedItems.push(newItem);
  res.status(201).json(newItem);
});

app.get('/api/items/user/:nickname', (req: Request, res: Response) => {
  const { nickname } = req.params;
  const userItems = seedItems.filter(item => item.ownerNickname === nickname);
  res.json(userItems.sort((a, b) => b.createdAt - a.createdAt));
});

app.post('/api/requests', (req: Request, res: Response) => {
  const { fromUser, seedItemId, exchangeQuantity } = req.body;
  const seedItem = seedItems.find(item => item.id === seedItemId);
  if (!seedItem) {
    return res.status(404).json({ error: '条目不存在' });
  }
  if (seedItem.ownerNickname === fromUser) {
    return res.status(400).json({ error: '不能交换自己发布的条目' });
  }
  if (seedItem.quantity < exchangeQuantity) {
    return res.status(400).json({ error: '数量不足' });
  }
  const newRequest: ExchangeRequest = {
    id: uuidv4(),
    fromUser,
    toUser: seedItem.ownerNickname,
    seedItemId,
    seedItem,
    exchangeQuantity,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  exchangeRequests.push(newRequest);
  res.status(201).json(newRequest);
});

app.get('/api/requests/from/:nickname', (req: Request, res: Response) => {
  const { nickname } = req.params;
  const requests = exchangeRequests
    .filter(r => r.fromUser === nickname)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(requests);
});

app.get('/api/requests/to/:nickname', (req: Request, res: Response) => {
  const { nickname } = req.params;
  const requests = exchangeRequests
    .filter(r => r.toUser === nickname)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(requests);
});

app.put('/api/requests/:id/confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const request = exchangeRequests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ error: '请求不存在' });
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ error: '请求状态不允许确认' });
  }
  const seedItem = seedItems.find(item => item.id === request.seedItemId);
  if (!seedItem || seedItem.quantity < request.exchangeQuantity) {
    return res.status(400).json({ error: '库存不足' });
  }
  seedItem.quantity -= request.exchangeQuantity;
  request.status = 'confirmed';
  request.updatedAt = Date.now();
  request.seedItem = { ...seedItem };
  res.json(request);
});

app.put('/api/requests/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;
  const request = exchangeRequests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ error: '请求不存在' });
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ error: '请求状态不允许取消' });
  }
  request.status = 'cancelled';
  request.updatedAt = Date.now();
  res.json(request);
});

app.put('/api/requests/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const request = exchangeRequests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ error: '请求不存在' });
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ error: '请求状态不允许拒绝' });
  }
  request.status = 'rejected';
  request.updatedAt = Date.now();
  res.json(request);
});

app.get('/api/stats', (_req: Request, res: Response) => {
  const todayStart = getTodayStart();
  const todayNewItems = seedItems.filter(item => item.createdAt >= todayStart).length;
  const todaySuccessfulExchanges = exchangeRequests.filter(
    r => r.status === 'confirmed' && r.updatedAt >= todayStart
  ).length;
  const stats: Stats = {
    todayNewItems,
    todaySuccessfulExchanges,
    totalItems: seedItems.length,
  };
  res.json(stats);
});

app.get('/api/history/completed/:nickname', (req: Request, res: Response) => {
  const { nickname } = req.params;
  const completed = exchangeRequests
    .filter(
      r =>
        r.status === 'confirmed' &&
        (r.fromUser === nickname || r.toUser === nickname)
    )
    .sort((a, b) => b.updatedAt - a.createdAt);
  res.json(completed);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
