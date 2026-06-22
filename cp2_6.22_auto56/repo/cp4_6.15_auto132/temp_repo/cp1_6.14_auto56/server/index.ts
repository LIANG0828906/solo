import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(process.cwd(), 'db.json');

interface Flower {
  id: string;
  name: 'rose' | 'lily' | 'sunflower' | 'baby_breath';
  nameCn: string;
  emoji: string;
  color: string;
  price: number;
  shelfLife: number;
  remainingDays: number;
  purchaseCost: number;
}

interface Bouquet {
  id: string;
  flowers: Flower[];
  name: string;
  price: number;
  color: string;
  remainingDays: number;
  shelfPosition?: { row: number; col: number };
}

interface Customer {
  id: string;
  name: string;
  avatar: string;
  requirements: {
    colors?: string[];
    flowerTypes?: string[];
    maxPrice?: number;
    minPrice?: number;
  };
  satisfaction: number;
}

interface Order {
  id: string;
  customerId: string;
  bouquetId?: string;
  status: 'pending' | 'success' | 'failed';
  price: number;
  timestamp: string;
  satisfactionDelta: number;
}

interface ShopStatus {
  reputation: number;
  revenue: number;
  dayNumber: number;
}

interface DbSchema {
  flowers: Flower[];
  bouquets: Bouquet[];
  customers: Customer[];
  orders: Order[];
  status: ShopStatus;
}

const FLOWER_CATALOG = [
  { name: 'rose' as const, nameCn: '玫瑰', emoji: '🌹', color: '#E8899E', price: 15, shelfLife: 5, purchaseCost: 6 },
  { name: 'lily' as const, nameCn: '百合', emoji: '🌸', color: '#FFD6E0', price: 12, shelfLife: 4, purchaseCost: 5 },
  { name: 'sunflower' as const, nameCn: '向日葵', emoji: '🌻', color: '#FFD93D', price: 10, shelfLife: 6, purchaseCost: 4 },
  { name: 'baby_breath' as const, nameCn: '满天星', emoji: '💐', color: '#F0E6FF', price: 8, shelfLife: 7, purchaseCost: 3 },
];

const CUSTOMER_NAMES = ['小明', '小红', '小华', '阿花', '大壮', '小美', '阿强', '小雪', '阿宝', '小兰'];
const CUSTOMER_AVATARS = ['👧', '👦', '👩', '🧑', '👨', '👩‍🦰', '👨‍🦱', '👩‍🦳', '🧓', '👶'];

function readDb(): DbSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch {}
  return {
    flowers: FLOWER_CATALOG.map(c => ({
      id: uuidv4(),
      ...c,
      remainingDays: c.shelfLife,
    })),
    bouquets: [],
    customers: [],
    orders: [],
    status: { reputation: 100, revenue: 0, dayNumber: 1 },
  };
}

function writeDb(db: DbSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// Flowers API
app.get('/api/flowers', (_req, res) => {
  const db = readDb();
  res.json(db.flowers);
});

app.post('/api/flowers', (req, res) => {
  const db = readDb();
  const { name, quantity = 1 } = req.body;
  const catalog = FLOWER_CATALOG.find(c => c.name === name);
  if (!catalog) {
    res.status(400).json({ error: 'Unknown flower type' });
    return;
  }
  const newFlowers: Flower[] = [];
  for (let i = 0; i < quantity; i++) {
    const flower: Flower = { id: uuidv4(), ...catalog, remainingDays: catalog.shelfLife };
    newFlowers.push(flower);
    db.flowers.push(flower);
    db.status.revenue -= catalog.purchaseCost;
  }
  writeDb(db);
  res.json(db.flowers);
});

app.put('/api/flowers/:id', (req, res) => {
  const db = readDb();
  const idx = db.flowers.findIndex(f => f.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Flower not found' });
    return;
  }
  db.flowers[idx].remainingDays = req.body.remainingDays;
  writeDb(db);
  res.json(db.flowers[idx]);
});

app.delete('/api/flowers/:id', (req, res) => {
  const db = readDb();
  db.flowers = db.flowers.filter(f => f.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// Bouquets API
app.get('/api/bouquets', (_req, res) => {
  const db = readDb();
  res.json(db.bouquets);
});

app.post('/api/bouquets', (req, res) => {
  const db = readDb();
  const { flowerIds } = req.body;
  if (!flowerIds || flowerIds.length < 2) {
    res.status(400).json({ error: 'Need at least 2 flowers' });
    return;
  }
  const selectedFlowers = flowerIds
    .map((id: string) => db.flowers.find(f => f.id === id))
    .filter(Boolean) as Flower[];
  if (selectedFlowers.length < 2) {
    res.status(400).json({ error: 'Some flowers not found' });
    return;
  }
  const totalPrice = selectedFlowers.reduce((sum, f) => sum + f.price, 0);
  const minDays = Math.min(...selectedFlowers.map(f => f.remainingDays));
  const dominantFlower = selectedFlowers.reduce((a, b) => a.price > b.price ? a : b);
  const bouquet: Bouquet = {
    id: uuidv4(),
    flowers: selectedFlowers,
    name: selectedFlowers.map(f => f.nameCn).join('+'),
    price: Math.round(totalPrice * 1.3),
    color: dominantFlower.color,
    remainingDays: minDays,
  };
  db.bouquets.push(bouquet);
  db.flowers = db.flowers.filter(f => !flowerIds.includes(f.id));
  writeDb(db);
  res.json(bouquet);
});

// Customers API
app.get('/api/customers', (_req, res) => {
  const db = readDb();
  res.json(db.customers);
});

app.post('/api/customers', (_req, res) => {
  const db = readDb();
  const flowerTypes = ['rose', 'lily', 'sunflower', 'baby_breath'];
  const colors = ['#E8899E', '#FFD6E0', '#FFD93D', '#F0E6FF', '#FFFFFF'];
  const numTypes = Math.floor(Math.random() * 2) + 1;
  const selectedTypes = [...flowerTypes].sort(() => Math.random() - 0.5).slice(0, numTypes);
  const numColors = Math.floor(Math.random() * 2) + 1;
  const selectedColors = [...colors].sort(() => Math.random() - 0.5).slice(0, numColors);
  const maxPrice = Math.floor(Math.random() * 30) + 20;
  const customer: Customer = {
    id: uuidv4(),
    name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    avatar: CUSTOMER_AVATARS[Math.floor(Math.random() * CUSTOMER_AVATARS.length)],
    requirements: {
      flowerTypes: selectedTypes,
      colors: selectedColors,
      maxPrice,
      minPrice: Math.max(0, maxPrice - 15),
    },
    satisfaction: 5,
  };
  db.customers.push(customer);
  writeDb(db);
  res.json(customer);
});

app.delete('/api/customers/:id', (req, res) => {
  const db = readDb();
  const customer = db.customers.find(c => c.id === req.params.id);
  const reputationDelta = (customer && customer.satisfaction < 2) ? -5 : 0;
  db.customers = db.customers.filter(c => c.id !== req.params.id);
  if (reputationDelta !== 0) {
    db.status.reputation = Math.max(0, db.status.reputation + reputationDelta);
  }
  writeDb(db);
  res.json({ reputationDelta });
});

// Orders API
app.get('/api/orders', (_req, res) => {
  const db = readDb();
  res.json(db.orders);
});

app.post('/api/orders/match', (req, res) => {
  const db = readDb();
  const { customerId, bouquetId } = req.body;
  const customer = db.customers.find(c => c.id === customerId);
  const bouquet = db.bouquets.find(b => b.id === bouquetId);
  if (!customer || !bouquet) {
    res.status(404).json({ error: 'Customer or bouquet not found' });
    return;
  }
  const req_ = customer.requirements;
  let match = true;
  if (req_.maxPrice != null && bouquet.price > req_.maxPrice) match = false;
  if (req_.minPrice != null && bouquet.price < req_.minPrice) match = false;
  if (req_.flowerTypes && req_.flowerTypes.length > 0) {
    const bouquetTypes = bouquet.flowers.map(f => f.name);
    if (!req_.flowerTypes.some(t => bouquetTypes.includes(t))) match = false;
  }
  if (req_.colors && req_.colors.length > 0) {
    const bouquetColors = bouquet.flowers.map(f => f.color);
    if (!req_.colors.some(c => bouquetColors.includes(c))) match = false;
  }

  if (match) {
    db.status.revenue += bouquet.price;
    const order: Order = {
      id: uuidv4(),
      customerId,
      bouquetId,
      status: 'success',
      price: bouquet.price,
      timestamp: new Date().toISOString(),
      satisfactionDelta: 0,
    };
    db.orders.push(order);
    db.bouquets = db.bouquets.filter(b => b.id !== bouquetId);
    db.customers = db.customers.filter(c => c.id !== customerId);
    writeDb(db);
    res.json({ match: true, order });
  } else {
    const updatedSatisfaction = Math.max(0, customer.satisfaction - 0.5);
    const cidx = db.customers.findIndex(c => c.id === customerId);
    db.customers[cidx].satisfaction = updatedSatisfaction;
    const shouldLeave = updatedSatisfaction < 2;
    let reputationDelta = 0;
    if (shouldLeave) {
      reputationDelta = -5;
      db.status.reputation = Math.max(0, db.status.reputation + reputationDelta);
      db.customers = db.customers.filter(c => c.id !== customerId);
    }
    const order: Order = {
      id: uuidv4(),
      customerId,
      status: 'failed',
      price: 0,
      timestamp: new Date().toISOString(),
      satisfactionDelta: -0.5,
    };
    db.orders.push(order);
    writeDb(db);
    res.json({ match: false, order });
  }
});

// Report API
app.get('/api/report/daily', (_req, res) => {
  const db = readDb();
  const hours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const successOrders = db.orders.filter(o => o.status === 'success');
  const failedOrders = db.orders.filter(o => o.status === 'failed');
  const totalRevenue = successOrders.reduce((s, o) => s + o.price, 0);
  const purchaseCost = db.flowers.reduce((s, f) => s + f.purchaseCost, 0) +
    db.bouquets.reduce((s, b) => s + b.flowers.reduce((sf, f) => sf + f.purchaseCost, 0), 0);
  const spoiledCost = 30;
  const operatingCost = 20;

  const report = {
    date: new Date().toLocaleDateString('zh-CN'),
    revenue: hours.map(h => ({
      hour: h,
      amount: Math.floor(Math.random() * 80) + 20,
    })),
    costs: [
      { category: '进货成本', value: purchaseCost || 100 },
      { category: '损耗成本', value: spoiledCost },
      { category: '运营成本', value: operatingCost },
    ],
    satisfactionTrend: hours.map(h => ({
      time: h,
      value: Math.round((Math.random() * 2 + 3) * 10) / 10,
    })),
    totalRevenue,
    totalCost: purchaseCost + spoiledCost + operatingCost,
    profit: totalRevenue - (purchaseCost + spoiledCost + operatingCost),
    reputation: db.status.reputation,
    suggestions: [
      '🌹 玫瑰销量最高，建议增加玫瑰进货量',
      '⚠️ 注意控制进货节奏，减少损耗',
      '📈 下午14:00-16:00为客流高峰，提前备好花束',
      '💡 满天星作为配花很受欢迎，多做混合花束',
    ],
    spoiledFlowers: 2,
    completedOrders: successOrders.length,
    failedOrders: failedOrders.length,
  };
  res.json(report);
});

// Status API
app.get('/api/status', (_req, res) => {
  const db = readDb();
  res.json(db.status);
});

app.post('/api/reputation', (req, res) => {
  const db = readDb();
  db.status.reputation = Math.max(0, Math.min(100, db.status.reputation + req.body.delta));
  writeDb(db);
  res.json({ reputation: db.status.reputation });
});

// Next day
app.post('/api/next-day', (_req, res) => {
  const db = readDb();
  db.flowers = db.flowers.map(f => ({
    ...f,
    remainingDays: Math.max(0, f.remainingDays - 1),
  })).filter(f => f.remainingDays > 0);
  db.bouquets = db.bouquets.map(b => {
    const minDays = Math.min(...b.flowers.map(f => f.remainingDays));
    return { ...b, remainingDays: Math.max(0, minDays) };
  }).filter(b => b.remainingDays > 0);
  db.customers = [];
  db.orders = [];
  db.status.dayNumber += 1;
  db.status.revenue = 0;
  writeDb(db);
  res.json(db.status);
});

app.listen(PORT, () => {
  console.log(`🌸 花语小店后端服务运行中 -> http://localhost:${PORT}`);
});
