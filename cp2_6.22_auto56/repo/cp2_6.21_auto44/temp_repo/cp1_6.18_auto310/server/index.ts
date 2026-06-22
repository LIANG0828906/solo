import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DB_PATH = path.join(__dirname, '..', 'db.json');

interface LogEntry {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
}

interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  phone: string;
  productType: '饰品' | '陶瓷' | '木工' | '织物';
  description: string;
  referenceImages: string[];
  designImages: string[];
  finalImages: string[];
  status: '待确认' | '设计中' | '制作中' | '待发货' | '已完成';
  createdAt: string;
  updatedAt: string;
  logs: LogEntry[];
}

interface Database {
  orders: Order[];
}

const readDB = (): Database => {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

const writeDB = (data: Database) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const generateOrderNo = (): string => {
  const db = readDB();
  const existingNos = new Set(db.orders.map(o => o.orderNo));
  let orderNo: string;
  do {
    const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    orderNo = `C${num}`;
  } while (existingNos.has(orderNo));
  return orderNo;
};

app.get('/api/orders', (_req, res) => {
  const db = readDB();
  res.json(db.orders.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
});

app.get('/api/orders/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const db = readDB();
  const { customerName, phone, productType, description, referenceImages } = req.body;

  const newOrder: Order = {
    id: uuidv4(),
    orderNo: generateOrderNo(),
    customerName,
    phone,
    productType,
    description,
    referenceImages: referenceImages || [],
    designImages: [],
    finalImages: [],
    status: '待确认',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: []
  };

  db.orders.push(newOrder);
  writeDB(db);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const { status } = req.body;
  db.orders[index].status = status;
  db.orders[index].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.orders[index]);
});

app.post('/api/orders/:id/logs', (req, res) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const { author, avatar, content } = req.body;
  const newLog: LogEntry = {
    id: uuidv4(),
    author,
    avatar,
    content,
    timestamp: new Date().toISOString()
  };

  db.orders[index].logs.unshift(newLog);
  db.orders[index].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(newLog);
});

app.post('/api/orders/:id/design-images', (req, res) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const { image } = req.body;
  db.orders[index].designImages.push(image);
  db.orders[index].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.orders[index]);
});

app.post('/api/orders/:id/final-images', (req, res) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const { image } = req.body;
  db.orders[index].finalImages.push(image);
  db.orders[index].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.orders[index]);
});

app.delete('/api/orders/:id', (req, res) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  db.orders.splice(index, 1);
  writeDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
