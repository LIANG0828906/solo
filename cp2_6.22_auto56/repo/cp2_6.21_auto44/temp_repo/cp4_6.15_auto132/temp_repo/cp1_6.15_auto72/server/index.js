import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const flowers = [
  { id: 'f1', name: '红玫瑰', category: '玫瑰', image: 'https://images.unsplash.com/photo-1518882605630-8eb56d7e78c2?w=200&h=200&fit=crop', price: 8, stock: 100, threshold: 20 },
  { id: 'f2', name: '粉玫瑰', category: '玫瑰', image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&h=200&fit=crop', price: 7, stock: 5, threshold: 20 },
  { id: 'f3', name: '白玫瑰', category: '玫瑰', image: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=200&h=200&fit=crop', price: 7, stock: 50, threshold: 15 },
  { id: 'f4', name: '白百合', category: '百合', image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&h=200&fit=crop', price: 12, stock: 30, threshold: 10 },
  { id: 'f5', name: '粉百合', category: '百合', image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=200&h=200&fit=crop', price: 13, stock: 8, threshold: 12 },
  { id: 'f6', name: '向日葵', category: '向日葵', image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=200&h=200&fit=crop', price: 6, stock: 15, threshold: 15 },
  { id: 'f7', name: '康乃馨', category: '康乃馨', image: 'https://images.unsplash.com/photo-1554613210-5d731495d395?w=200&h=200&fit=crop', price: 5, stock: 60, threshold: 25 },
  { id: 'f8', name: '满天星', category: '配花', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=200&fit=crop', price: 3, stock: 3, threshold: 30 },
  { id: 'f9', name: '尤加利叶', category: '配叶', image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=200&h=200&fit=crop', price: 4, stock: 40, threshold: 20 },
  { id: 'f10', name: '洋桔梗', category: '桔梗', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=200&fit=crop', price: 9, stock: 25, threshold: 10 },
  { id: 'f11', name: '绣球花', category: '绣球', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=200&fit=crop', price: 15, stock: 12, threshold: 8 },
  { id: 'f12', name: '小雏菊', category: '配花', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=200&fit=crop', price: 4, stock: 80, threshold: 30 },
];

const subscriptions = [
  {
    id: 's1',
    name: '每周一花·清新款',
    price: 99,
    cycle: 'weekly',
    flowers: ['f1', 'f4', 'f9'],
    deliveryArea: '花店周边5公里内',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    id: 's2',
    name: '双周惊喜·浪漫款',
    price: 168,
    cycle: 'biweekly',
    flowers: ['f2', 'f5', 'f7', 'f8'],
    deliveryArea: '花店周边5公里内',
    image: 'https://images.unsplash.com/photo-1518882605630-8eb56d7e78c2?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    id: 's3',
    name: '月度臻享·豪华款',
    price: 298,
    cycle: 'monthly',
    flowers: ['f1', 'f4', 'f6', 'f11', 'f9'],
    deliveryArea: '花店周边5公里内',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString()
  },
];

const orders = [
  {
    id: 'o1',
    flowers: [{ flowerId: 'f1', quantity: 10 }, { flowerId: 'f8', quantity: 5 }],
    wrapping: 'kraft',
    cardMessage: '生日快乐，天天开心！',
    address: '阳光花园小区3号楼2单元501',
    deliveryTime: new Date().toISOString().split('T')[0],
    deliverySlot: 'morning',
    status: 'pending',
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date().toISOString().split('T')[0] + ' 上午10:00'
  },
  {
    id: 'o2',
    flowers: [{ flowerId: 'f4', quantity: 3 }, { flowerId: 'f9', quantity: 8 }],
    wrapping: 'floral',
    cardMessage: '母亲节快乐',
    address: '幸福路88号花语公寓1号楼',
    deliveryTime: new Date().toISOString().split('T')[0],
    deliverySlot: 'afternoon',
    status: 'delivering',
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date().toISOString().split('T')[0] + ' 下午3:00'
  },
];

app.get('/api/flowers', (req, res) => {
  res.json(flowers);
});

app.get('/api/flowers/:id', (req, res) => {
  const flower = flowers.find(f => f.id === req.params.id);
  if (!flower) return res.status(404).json({ error: '花材不存在' });
  res.json(flower);
});

app.patch('/api/flowers/:id', (req, res) => {
  const flowerIndex = flowers.findIndex(f => f.id === req.params.id);
  if (flowerIndex === -1) return res.status(404).json({ error: '花材不存在' });
  const { stock, threshold } = req.body;
  if (stock !== undefined) flowers[flowerIndex].stock = stock;
  if (threshold !== undefined) flowers[flowerIndex].threshold = threshold;
  res.json(flowers[flowerIndex]);
});

app.post('/api/flowers/:id/restock', (req, res) => {
  const flowerIndex = flowers.findIndex(f => f.id === req.params.id);
  if (flowerIndex === -1) return res.status(404).json({ error: '花材不存在' });
  const { amount } = req.body;
  flowers[flowerIndex].stock += amount;
  res.json(flowers[flowerIndex]);
});

app.get('/api/subscriptions', (req, res) => {
  res.json(subscriptions);
});

app.post('/api/subscriptions', (req, res) => {
  const newSub = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  subscriptions.unshift(newSub);
  res.status(201).json(newSub);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/orders/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.deliveryTime.startsWith(today));
  res.json(todayOrders);
});

app.post('/api/orders', (req, res) => {
  const today = new Date();
  const deliveryDate = new Date(req.body.deliveryTime);
  const isToday = deliveryDate.toDateString() === today.toDateString();
  const slot = req.body.deliverySlot === 'morning' ? '上午10:00' : '下午3:00';
  
  const newOrder = {
    id: 'o' + Date.now(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
    estimatedDelivery: req.body.deliveryTime + ' ' + slot
  };
  orders.push(newOrder);
  res.status(201).json({
    orderId: newOrder.id,
    estimatedDelivery: newOrder.estimatedDelivery
  });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const orderIndex = orders.findIndex(o => o.id === req.params.id);
  if (orderIndex === -1) return res.status(404).json({ error: '订单不存在' });
  const { status } = req.body;
  orders[orderIndex].status = status;
  res.json(orders[orderIndex]);
});

app.listen(PORT, () => {
  console.log(`花语派后端服务运行在 http://localhost:${PORT}`);
});
