import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface MenuItem {
  id: string;
  name: string;
  category: 'drink' | 'dessert' | 'light_meal';
  price: number;
  emoji: string;
  available: boolean;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  memberId: string;
  items: OrderItem[];
  totalPrice: number;
  pointsEarned: number;
  status: 'making' | 'completed';
  createdAt: string;
}

interface Member {
  id: string;
  cardNumber: string;
  nickname: string;
  phone: string;
  points: number;
  createdAt: string;
}

interface PointAdjustment {
  id: string;
  memberId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

const menus: MenuItem[] = [
  { id: uuidv4(), name: '美式咖啡', category: 'drink', price: 18, emoji: '☕️', available: true },
  { id: uuidv4(), name: '拿铁', category: 'drink', price: 22, emoji: '🧋', available: true },
  { id: uuidv4(), name: '抹茶拿铁', category: 'drink', price: 25, emoji: '🍵', available: true },
  { id: uuidv4(), name: '冰摩卡', category: 'drink', price: 24, emoji: '🥤', available: true },
  { id: uuidv4(), name: '提拉米苏', category: 'dessert', price: 28, emoji: '🍰', available: true },
  { id: uuidv4(), name: '芝士蛋糕', category: 'dessert', price: 26, emoji: '🧁', available: true },
  { id: uuidv4(), name: '曲奇饼干', category: 'dessert', price: 12, emoji: '🍪', available: true },
  { id: uuidv4(), name: '牛角包', category: 'light_meal', price: 15, emoji: '🥐', available: true },
  { id: uuidv4(), name: '凯撒沙拉', category: 'light_meal', price: 32, emoji: '🥗', available: true },
  { id: uuidv4(), name: '三明治', category: 'light_meal', price: 22, emoji: '🥪', available: true },
];

const orders: Order[] = [];
const members: Member[] = [];
const pointAdjustments: PointAdjustment[] = [];

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/menu', (_req: Request, res: Response) => {
  res.json(menus.filter((m) => m.available));
});

app.post('/api/menu', (req: Request, res: Response) => {
  const { name, category, price, emoji, available } = req.body as Omit<MenuItem, 'id'>;
  const item: MenuItem = { id: uuidv4(), name, category, price, emoji, available: available ?? true };
  menus.push(item);
  res.status(201).json(item);
});

app.put('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = menus.findIndex((m) => m.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Menu item not found' });
    return;
  }
  menus[idx] = { ...menus[idx], ...req.body, id };
  res.json(menus[idx]);
});

app.delete('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = menus.findIndex((m) => m.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Menu item not found' });
    return;
  }
  menus[idx].available = false;
  res.json(menus[idx]);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const { memberId, items, totalPrice } = req.body as { memberId: string; items: OrderItem[]; totalPrice: number };
  const pointsEarned = Math.floor(totalPrice * 0.1);
  const order: Order = {
    id: uuidv4(),
    memberId,
    items,
    totalPrice,
    pointsEarned,
    status: 'making',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  const member = members.find((m) => m.id === memberId);
  if (member) {
    member.points += pointsEarned;
  }
  res.status(201).json(order);
});

app.get('/api/orders', (req: Request, res: Response) => {
  const { status } = req.query as { status?: 'making' | 'completed' };
  let result = [...orders];
  if (status) {
    result = result.filter((o) => o.status === status);
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result);
});

app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: 'making' | 'completed' };
  const order = orders.find((o) => o.id === id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  order.status = status;
  res.json(order);
});

app.post('/api/members/register', (req: Request, res: Response) => {
  const { nickname, phone } = req.body as { nickname: string; phone: string };
  if (members.some((m) => m.phone === phone)) {
    res.status(400).json({ error: 'Phone number already registered' });
    return;
  }
  const cardNumber = 'CF' + String(Math.floor(100000 + Math.random() * 900000));
  const member: Member = {
    id: uuidv4(),
    cardNumber,
    nickname,
    phone,
    points: 0,
    createdAt: new Date().toISOString(),
  };
  members.push(member);
  res.status(201).json(member);
});

app.post('/api/members/login', (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string };
  const member = members.find((m) => m.phone === phone);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  res.json(member);
});

app.get('/api/members/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const member = members.find((m) => m.id === id);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  const memberOrders = orders.filter((o) => o.memberId === id);
  res.json({ ...member, orders: memberOrders });
});

app.put('/api/members/:id/points', (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, reason } = req.body as { amount: number; reason: string };
  const member = members.find((m) => m.id === id);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  member.points += amount;
  const adjustment: PointAdjustment = {
    id: uuidv4(),
    memberId: id,
    amount,
    reason,
    createdAt: new Date().toISOString(),
  };
  pointAdjustments.push(adjustment);
  res.json({ member, adjustment });
});

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body as { password: string };
  if (password === 'admin') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

export default app;
