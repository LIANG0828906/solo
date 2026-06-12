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
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
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

  CREATE TABLE IF NOT EXISTS restock_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leatherId INTEGER NOT NULL,
    suggestedArea REAL NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (leatherId) REFERENCES leathers(id)
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

function checkLowStockAndSuggest(leather) {
  if (leather.area < leather.threshold) {
    const existing = db
      .prepare('SELECT * FROM restock_suggestions WHERE leatherId = ? AND status = ?')
      .get(leather.id, 'pending');
    if (!existing) {
      const suggested = Math.max(leather.threshold * 2, 10);
      db.prepare(
        'INSERT INTO restock_suggestions (leatherId, suggestedArea, status) VALUES (?, ?, ?)'
      ).run(leather.id, suggested, 'pending');
    }
  }
}

app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
    const withHistory = orders.map((order) => {
      const history = db
        .prepare(
          'SELECT status, created_at as timestamp FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC'
        )
        .all(order.id);
      return { ...order, statusHistory: history };
    });
    res.json(withHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    const history = db
      .prepare(
        'SELECT status, created_at as timestamp FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC'
      )
      .all(order.id);
    res.json({ ...order, statusHistory: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      productType,
      referenceImage,
      engravingText,
      hardwareColor,
      preferredDeliveryDate,
    } = req.body;

    if (!customerName || !customerEmail || !productType || !hardwareColor) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

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

    db.prepare('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)').run(
      orderId,
      'pending'
    );

    const pref = db
      .prepare('SELECT * FROM customer_preferences WHERE customerEmail = ?')
      .get(customerEmail);
    if (pref) {
      db.prepare(
        `UPDATE customer_preferences SET 
          hardwareColor = COALESCE(?, hardwareColor),
          engravingText = COALESCE(NULLIF(?, ''), engravingText),
          orderCount = orderCount + 1
        WHERE customerEmail = ?`
      ).run(hardwareColor, engravingText, customerEmail);
    } else {
      db.prepare(
        `INSERT INTO customer_preferences (customerEmail, hardwareColor, engravingText, orderCount)
         VALUES (?, ?, ?, 1)`
      ).run(customerEmail, hardwareColor, engravingText || '');
    }

    const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const history = db
      .prepare(
        'SELECT status, created_at as timestamp FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC'
      )
      .all(orderId);

    res.status(201).json({ ...newOrder, statusHistory: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ error: '订单不存在' });

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    db.prepare('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)').run(
      orderId,
      status
    );

    if (status === 'designing' && order.status === 'pending') {
      const requiredArea = PRODUCT_AREA[order.productType] || 0.3;
      const leather = db
        .prepare('SELECT * FROM leathers WHERE area >= ? ORDER BY area ASC LIMIT 1')
        .get(requiredArea);
      if (leather) {
        const newArea = leather.area - requiredArea;
        db.prepare('UPDATE leathers SET area = ? WHERE id = ?').run(newArea, leather.id);
        db.prepare('UPDATE orders SET leatherId = ? WHERE id = ?').run(leather.id, orderId);

        const updatedLeather = { ...leather, area: newArea };
        checkLowStockAndSuggest(updatedLeather);
      }
    }

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const history = db
      .prepare(
        'SELECT status, created_at as timestamp FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC'
      )
      .all(orderId);
    res.json({ ...updatedOrder, statusHistory: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leathers', (req, res) => {
  try {
    const leathers = db.prepare('SELECT * FROM leathers ORDER BY id ASC').all();
    res.json(leathers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leathers', (req, res) => {
  try {
    const { type, color, thickness, area, unitCost, threshold } = req.body;
    const result = db
      .prepare(
        'INSERT INTO leathers (type, color, thickness, area, unitCost, threshold) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(type, color, thickness, area || 0, unitCost || 0, threshold || 5);
    const leather = db.prepare('SELECT * FROM leathers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(leather);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leathers/:id', (req, res) => {
  try {
    const { area, unitCost, threshold } = req.body;
    db.prepare(
      'UPDATE leathers SET area = COALESCE(?, area), unitCost = COALESCE(?, unitCost), threshold = COALESCE(?, threshold) WHERE id = ?'
    ).run(area, unitCost, threshold, req.params.id);
    const leather = db.prepare('SELECT * FROM leathers WHERE id = ?').get(req.params.id);
    if (!leather) return res.status(404).json({ error: '库存不存在' });
    checkLowStockAndSuggest(leather);
    res.json(leather);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restock-suggestions', (req, res) => {
  try {
    const suggestions = db
      .prepare(
        `SELECT rs.*, l.type, l.color, l.thickness, l.area as currentArea, l.unitCost
         FROM restock_suggestions rs
         JOIN leathers l ON rs.leatherId = l.id
         WHERE rs.status = 'pending'
         ORDER BY rs.createdAt DESC`
      )
      .all();
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/restock-suggestions/:id/resolve', (req, res) => {
  try {
    const suggestion = db.prepare('SELECT * FROM restock_suggestions WHERE id = ?').get(req.params.id);
    if (!suggestion) return res.status(404).json({ error: '补货建议不存在' });

    db.prepare('UPDATE restock_suggestions SET status = ? WHERE id = ?').run(
      'resolved',
      req.params.id
    );
    res.json({ message: '已处理' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/preferences/:email', (req, res) => {
  try {
    const pref = db
      .prepare('SELECT * FROM customer_preferences WHERE customerEmail = ?')
      .get(req.params.email);
    if (!pref) return res.json(null);
    res.json(pref);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`皮具工作室管理 API 服务运行在 http://localhost:${PORT}`);
});
