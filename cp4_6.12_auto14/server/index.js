import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const db = new Database(path.join(__dirname, 'leather.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS leathers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    thickness TEXT NOT NULL,
    area REAL NOT NULL DEFAULT 0,
    unitCost REAL NOT NULL DEFAULT 0,
    threshold REAL NOT NULL DEFAULT 5
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT NOT NULL,
    customerEmail TEXT NOT NULL,
    productType TEXT NOT NULL,
    referenceImage TEXT,
    engravingText TEXT,
    hardwareColor TEXT NOT NULL,
    preferredDeliveryDate TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    leatherId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leatherId) REFERENCES leathers(id)
  );

  CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS customer_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerEmail TEXT UNIQUE NOT NULL,
    leatherType TEXT,
    leatherColor TEXT,
    hardwareColor TEXT,
    engravingText TEXT,
    orderCount INTEGER NOT NULL DEFAULT 0
  );
`);

const leatherCount = db.prepare('SELECT COUNT(*) as count FROM leathers').get().count;
if (leatherCount === 0) {
  const insertLeather = db.prepare(`
    INSERT INTO leathers (type, color, thickness, area, unitCost, threshold)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertLeather.run('cowhide', 'brown', '1.5mm', 20, 25, 5);
  insertLeather.run('cowhide', 'black', '1.5mm', 15, 25, 5);
  insertLeather.run('veg-tanned', 'brown', '2.0mm', 8, 35, 5);
  insertLeather.run('sheepskin', 'red', '1.0mm', 3, 40, 5);
  insertLeather.run('croc-embossed', 'navy', '1.2mm', 4, 50, 5);
}

const PRODUCT_AREA = {
  wallet: 0.3,
  cardholder: 0.15,
  keychain: 0.1,
  bracelet: 0.08,
  belt: 0.4,
};

app.get('/api/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  const withHistory = orders.map((order) => {
    const history = db
      .prepare('SELECT status, timestamp FROM order_status_history WHERE orderId = ? ORDER BY timestamp ASC')
      .all(order.id);
    return { ...order, statusHistory: history };
  });
  res.json(withHistory);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  const history = db
    .prepare('SELECT status, timestamp FROM order_status_history WHERE orderId = ? ORDER BY timestamp ASC')
    .all(order.id);
  res.json({ ...order, statusHistory: history });
});

app.post('/api/orders', (req, res) => {
  const {
    customerName,
    customerEmail,
    productType,
    referenceImage,
    engravingText,
    hardwareColor,
    preferredDeliveryDate,
  } = req.body;

  const insertOrder = db.prepare(`
    INSERT INTO orders (customerName, customerEmail, productType, referenceImage, engravingText, hardwareColor, preferredDeliveryDate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insertOrder.run(
    customerName,
    customerEmail,
    productType,
    referenceImage || null,
    engravingText || '',
    hardwareColor,
    preferredDeliveryDate || ''
  );
  const orderId = result.lastInsertRowid;

  db.prepare('INSERT INTO order_status_history (orderId, status) VALUES (?, ?)').run(orderId, 'pending');

  const pref = db.prepare('SELECT * FROM customer_preferences WHERE customerEmail = ?').get(customerEmail);
  if (pref) {
    db.prepare(
      `UPDATE customer_preferences SET 
        leatherType = COALESCE(?, leatherType),
        leatherColor = COALESCE(?, leatherColor),
        hardwareColor = COALESCE(?, hardwareColor),
        engravingText = COALESCE(NULLIF(?, ''), engravingText),
        orderCount = orderCount + 1
      WHERE customerEmail = ?`
    ).run(null, null, hardwareColor, engravingText, customerEmail);
  } else {
    db.prepare(
      `INSERT INTO customer_preferences (customerEmail, hardwareColor, engravingText, orderCount)
       VALUES (?, ?, ?, 1)`
    ).run(customerEmail, hardwareColor, engravingText || '');
  }

  const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const history = db
    .prepare('SELECT status, timestamp FROM order_status_history WHERE orderId = ? ORDER BY timestamp ASC')
    .all(orderId);

  res.status(201).json({ ...newOrder, statusHistory: history });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
  db.prepare('INSERT INTO order_status_history (orderId, status) VALUES (?, ?)').run(orderId, status);

  if (status === 'designing' && order.status === 'pending') {
    const requiredArea = PRODUCT_AREA[order.productType] || 0.3;
    const leather = db.prepare('SELECT * FROM leathers ORDER BY area DESC LIMIT 1').get();
    if (leather && leather.area >= requiredArea) {
      db.prepare('UPDATE leathers SET area = area - ? WHERE id = ?').run(requiredArea, leather.id);
      db.prepare('UPDATE orders SET leatherId = ? WHERE id = ?').run(leather.id, orderId);
    }
  }

  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const history = db
    .prepare('SELECT status, timestamp FROM order_status_history WHERE orderId = ? ORDER BY timestamp ASC')
    .all(orderId);
  res.json({ ...updatedOrder, statusHistory: history });
});

app.get('/api/leathers', (req, res) => {
  const leathers = db.prepare('SELECT * FROM leathers ORDER BY id ASC').all();
  res.json(leathers);
});

app.post('/api/leathers', (req, res) => {
  const { type, color, thickness, area, unitCost, threshold } = req.body;
  const result = db
    .prepare(
      'INSERT INTO leathers (type, color, thickness, area, unitCost, threshold) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(type, color, thickness, area || 0, unitCost || 0, threshold || 5);
  const leather = db.prepare('SELECT * FROM leathers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(leather);
});

app.put('/api/leathers/:id', (req, res) => {
  const { area, unitCost, threshold } = req.body;
  db.prepare(
    'UPDATE leathers SET area = COALESCE(?, area), unitCost = COALESCE(?, unitCost), threshold = COALESCE(?, threshold) WHERE id = ?'
  ).run(area, unitCost, threshold, req.params.id);
  const leather = db.prepare('SELECT * FROM leathers WHERE id = ?').get(req.params.id);
  if (!leather) return res.status(404).json({ error: '库存不存在' });
  res.json(leather);
});

app.get('/api/preferences/:email', (req, res) => {
  const pref = db.prepare('SELECT * FROM customer_preferences WHERE customerEmail = ?').get(req.params.email);
  if (!pref) return res.json(null);
  res.json(pref);
});

app.listen(PORT, () => {
  console.log(`皮具工作室管理 API 服务运行在 http://localhost:${PORT}`);
});
