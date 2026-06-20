import express from 'express';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const db = new Database(path.join(__dirname, '..', 'leather-workshop.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    leather_type TEXT NOT NULL,
    color TEXT NOT NULL,
    hardware TEXT NOT NULL,
    length REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    status TEXT NOT NULL DEFAULT '待接单',
    sub_status TEXT DEFAULT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    stock REAL NOT NULL,
    threshold REAL NOT NULL,
    consumption_rate REAL NOT NULL DEFAULT 1.2
  );

  CREATE TABLE IF NOT EXISTS consumption_logs (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const cols = db.prepare("PRAGMA table_info(materials)").all() as any[];
if (!cols.find((c: any) => c.name === 'consumption_rate')) {
  db.exec('ALTER TABLE materials ADD COLUMN consumption_rate REAL NOT NULL DEFAULT 1.2');
}

const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get() as { count: number };
if (materialCount.count === 0) {
  const insert = db.prepare('INSERT INTO materials (id, name, stock, threshold, consumption_rate) VALUES (?, ?, ?, ?, ?)');
  insert.run(uuidv4(), '头层牛皮', 50, 10, 1.2);
  insert.run(uuidv4(), '羊皮', 30, 8, 1.1);
  insert.run(uuidv4(), '鳄鱼皮', 15, 5, 1.5);
}

app.get('/api/orders', (_req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
  res.json(orders.map(o => ({ ...o, hardware: JSON.parse(o.hardware) })));
});

app.post('/api/orders', (req, res) => {
  const { leather_type, color, hardware, length, width, height } = req.body;
  if (!leather_type || !color || !hardware || length == null || width == null || height == null) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const id = uuidv4();
  const created_at = new Date().toISOString();
  db.prepare(
    'INSERT INTO orders (id, leather_type, color, hardware, length, width, height, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, leather_type, color, JSON.stringify(hardware), length, width, height, '待接单', created_at);
  res.json({
    id,
    leather_type,
    color,
    hardware,
    length,
    width,
    height,
    status: '待接单',
    sub_status: null,
    created_at,
  });
});

app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status, sub_status } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (status) {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  }
  if (sub_status !== undefined) {
    db.prepare('UPDATE orders SET sub_status = ? WHERE id = ?').run(sub_status, id);
  }

  if (sub_status === '裁料中' && order.sub_status !== '裁料中') {
    const material = db.prepare('SELECT * FROM materials WHERE name = ?').get(order.leather_type) as any;
    if (material) {
      const rate = material.consumption_rate ?? 1.2;
      const consumption = order.length * order.width * rate;
      const newStock = Math.max(0, material.stock - consumption);
      db.prepare('UPDATE materials SET stock = ? WHERE id = ?').run(newStock, material.id);
      db.prepare(
        'INSERT INTO consumption_logs (id, order_id, material_name, amount, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(uuidv4(), id, order.leather_type, consumption, new Date().toISOString());
    }
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  res.json({ ...updated, hardware: JSON.parse(updated.hardware) });
});

app.get('/api/materials', (_req, res) => {
  const materials = db.prepare('SELECT * FROM materials ORDER BY name').all();
  res.json(materials);
});

app.post('/api/materials', (req, res) => {
  const { name, stock, threshold, consumption_rate } = req.body;
  if (!name || stock == null || threshold == null) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const rate = consumption_rate ?? 1.2;
  const id = uuidv4();
  try {
    db.prepare('INSERT INTO materials (id, name, stock, threshold, consumption_rate) VALUES (?, ?, ?, ?, ?)').run(id, name, stock, threshold, rate);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: '原料名称已存在' });
    }
    throw err;
  }
  res.json({ id, name, stock, threshold, consumption_rate: rate });
});

app.patch('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  const { stock, threshold, name, consumption_rate } = req.body;

  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as any;
  if (!material) {
    return res.status(404).json({ error: '原料不存在' });
  }

  if (name !== undefined) {
    db.prepare('UPDATE materials SET name = ? WHERE id = ?').run(name, id);
  }
  if (stock !== undefined) {
    db.prepare('UPDATE materials SET stock = ? WHERE id = ?').run(stock, id);
  }
  if (threshold !== undefined) {
    db.prepare('UPDATE materials SET threshold = ? WHERE id = ?').run(threshold, id);
  }
  if (consumption_rate !== undefined) {
    db.prepare('UPDATE materials SET consumption_rate = ? WHERE id = ?').run(consumption_rate, id);
  }

  const updated = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
  res.json(updated);
});

app.get('/api/consumption-logs', (_req, res) => {
  const logs = db.prepare('SELECT * FROM consumption_logs ORDER BY created_at DESC').all();
  res.json(logs);
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
