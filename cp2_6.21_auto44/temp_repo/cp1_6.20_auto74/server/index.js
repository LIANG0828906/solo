import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const menuPath = join(dataDir, 'menu.json');
const ordersPath = join(dataDir, 'orders.json');

if (!existsSync(menuPath)) {
  writeFileSync(menuPath, '[]');
}
if (!existsSync(ordersPath)) {
  writeFileSync(ordersPath, '[]');
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const readJSON = (path) => {
  try {
    const data = readFileSync(path, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const writeJSON = (path, data) => {
  writeFileSync(path, JSON.stringify(data, null, 2));
};

app.get('/api/menu', (_req, res) => {
  const menu = readJSON(menuPath);
  res.json(menu);
});

app.post('/api/menu', (req, res) => {
  const menu = readJSON(menuPath);
  const newItem = {
    id: uuidv4(),
    ...req.body,
    available: true
  };
  menu.push(newItem);
  writeJSON(menuPath, menu);
  res.status(201).json(newItem);
});

app.put('/api/menu/:id', (req, res) => {
  const menu = readJSON(menuPath);
  const index = menu.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '菜单项不存在' });
  }
  menu[index] = { ...menu[index], ...req.body };
  writeJSON(menuPath, menu);
  res.json(menu[index]);
});

app.delete('/api/menu/:id', (req, res) => {
  const menu = readJSON(menuPath);
  const index = menu.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '菜单项不存在' });
  }
  const deleted = menu.splice(index, 1)[0];
  writeJSON(menuPath, menu);
  res.json(deleted);
});

app.get('/api/orders', (_req, res) => {
  const orders = readJSON(ordersPath);
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const orders = readJSON(ordersPath);
  const newOrder = {
    id: uuidv4(),
    tableNumber: req.body.tableNumber,
    items: req.body.items,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  writeJSON(ordersPath, orders);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const orders = readJSON(ordersPath);
  const index = orders.findIndex((order) => order.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '订单不存在' });
  }
  orders[index] = { ...orders[index], ...req.body };
  writeJSON(ordersPath, orders);
  res.json(orders[index]);
});

app.listen(PORT, () => {
  console.log(`咖啡馆服务器运行在 http://localhost:${PORT}`);
});
