import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbPath = join(__dirname, 'workshop.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS formulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mainDye TEXT NOT NULL,
      mordant TEXT NOT NULL,
      temperature INTEGER NOT NULL,
      duration REAL NOT NULL,
      ph REAL NOT NULL,
      colorFrom TEXT NOT NULL,
      colorTo TEXT NOT NULL,
      isAvailable INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fabricType TEXT NOT NULL,
      size TEXT NOT NULL,
      formulaId INTEGER NOT NULL,
      referenceImage TEXT,
      status TEXT DEFAULT 'pending',
      customerName TEXT,
      customerPhone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (formulaId) REFERENCES formulas(id)
    );

    CREATE TABLE IF NOT EXISTS order_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      status TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      origin TEXT NOT NULL,
      currentStock REAL NOT NULL,
      maxStock REAL NOT NULL,
      safeThreshold REAL NOT NULL,
      unit TEXT NOT NULL,
      dyeType TEXT NOT NULL
    );
  `);

  const formulaCount = db.prepare('SELECT COUNT(*) as count FROM formulas').get();
  if (formulaCount.count === 0) {
    const insertFormula = db.prepare(`
      INSERT INTO formulas (name, mainDye, mordant, temperature, duration, ph, colorFrom, colorTo, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertFormula.run('茜草红', '茜草', '明矾', 60, 2.5, 5.5, '#D32F2F', '#FFEBEE', 1);
    insertFormula.run('栀子黄', '栀子', '明矾', 50, 1.5, 6.0, '#F9A825', '#FFF8E1', 1);
    insertFormula.run('苏木紫', '苏木', '硫酸亚铁', 70, 3.0, 8.0, '#7B1FA2', '#F3E5F5', 1);
    insertFormula.run('蓝草蓝', '蓝草', '碱液', 45, 4.0, 9.5, '#1976D2', '#E3F2FD', 1);

    const insertInventory = db.prepare(`
      INSERT INTO inventory (name, origin, currentStock, maxStock, safeThreshold, unit, dyeType)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertInventory.run('茜草根', '云南', 2500, 5000, 800, 'g', '茜草红');
    insertInventory.run('栀子果', '福建', 1800, 4000, 600, 'g', '栀子黄');
    insertInventory.run('苏木心材', '广西', 1200, 3000, 500, 'g', '苏木紫');
    insertInventory.run('蓝草叶', '贵州', 300, 2500, 400, 'g', '蓝草蓝');
    insertInventory.run('明矾', '山东', 3500, 8000, 1000, 'g', '媒染剂');
    insertInventory.run('硫酸亚铁', '江苏', 2000, 5000, 700, 'g', '媒染剂');
    insertInventory.run('纯碱液', '广东', 15000, 30000, 5000, 'ml', '媒染剂');

    const insertOrder = db.prepare(`
      INSERT INTO orders (fabricType, size, formulaId, status, customerName, customerPhone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertLog = db.prepare(`
      INSERT INTO order_status_logs (orderId, status, timestamp)
      VALUES (?, ?, ?)
    `);
    
    const statuses = ['pending', 'confirmed', 'soaking', 'extracting', 'dyeing', 'fixing', 'washing', 'inspecting', 'completed'];
    const fabrics = ['cotton', 'linen', 'silk', 'blend'];
    const sizes = ['30x30cm', '50x50cm', '1mx1m', 'custom'];
    const names = ['张三', '李四', '王五', '赵六', '钱七'];
    
    for (let i = 0; i < 15; i++) {
      const fabric = fabrics[Math.floor(Math.random() * fabrics.length)];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const formulaId = Math.floor(Math.random() * 4) + 1;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const orderId = insertOrder.run(fabric, size, formulaId, status, name, `138${Math.floor(Math.random() * 100000000)}`).lastInsertRowid;
      
      const statusIndex = statuses.indexOf(status);
      for (let j = 0; j <= statusIndex; j++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setHours(date.getHours() - hoursAgo);
        date.setMinutes(Math.floor(Math.random() * 60));
        insertLog.run(orderId, statuses[j], date.toISOString());
      }
    }

    console.log('Database initialized with sample data');
  }
} catch (err) {
  console.error('Error initializing database:', err.message);
}

app.get('/api/formulas', (req, res) => {
  try {
    const formulas = db.prepare('SELECT * FROM formulas ORDER BY createdAt DESC').all();
    res.json(formulas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/formulas/available', (req, res) => {
  try {
    const formulas = db.prepare('SELECT * FROM formulas WHERE isAvailable = 1 ORDER BY createdAt DESC').all();
    res.json(formulas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/formulas', (req, res) => {
  try {
    const { name, mainDye, mordant, temperature, duration, ph, colorFrom, colorTo, isAvailable } = req.body;
    const info = db.prepare(`
      INSERT INTO formulas (name, mainDye, mordant, temperature, duration, ph, colorFrom, colorTo, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, mainDye, mordant, temperature, duration, ph, colorFrom, colorTo, isAvailable ? 1 : 0);
    const newFormula = db.prepare('SELECT * FROM formulas WHERE id = ?').get(info.lastInsertRowid);
    res.json(newFormula);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/formulas/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, mainDye, mordant, temperature, duration, ph, colorFrom, colorTo, isAvailable } = req.body;
    db.prepare(`
      UPDATE formulas SET name=?, mainDye=?, mordant=?, temperature=?, duration=?, ph=?, colorFrom=?, colorTo=?, isAvailable=?
      WHERE id=?
    `).run(name, mainDye, mordant, temperature, duration, ph, colorFrom, colorTo, isAvailable ? 1 : 0, id);
    const updatedFormula = db.prepare('SELECT * FROM formulas WHERE id = ?').get(id);
    res.json(updatedFormula);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/formulas/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM formulas WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, f.name as formulaName, f.colorFrom, f.colorTo
      FROM orders o
      JOIN formulas f ON o.formulaId = f.id
      ORDER BY o.createdAt DESC
    `).all();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id/logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM order_status_logs WHERE orderId=? ORDER BY timestamp ASC
    `).all(req.params.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { fabricType, size, formulaId, referenceImage, customerName, customerPhone } = req.body;
    const info = db.prepare(`
      INSERT INTO orders (fabricType, size, formulaId, referenceImage, customerName, customerPhone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(fabricType, size, formulaId, referenceImage, customerName, customerPhone);
    
    db.prepare(`
      INSERT INTO order_status_logs (orderId, status) VALUES (?, 'pending')
    `).run(info.lastInsertRowid);
    
    const newOrder = db.prepare(`
      SELECT o.*, f.name as formulaName, f.colorFrom, f.colorTo
      FROM orders o
      JOIN formulas f ON o.formulaId = f.id
      WHERE o.id = ?
    `).get(info.lastInsertRowid);
    
    res.json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, id);
    db.prepare(`
      INSERT INTO order_status_logs (orderId, status) VALUES (?, ?)
    `).run(id, status);
    
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory', (req, res) => {
  try {
    const inventory = db.prepare('SELECT * FROM inventory ORDER BY currentStock ASC').all();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/purchase-suggestions', (req, res) => {
  try {
    const suggestions = db.prepare(`
      SELECT 
        i.*,
        COUNT(o.id) as usageCount
      FROM inventory i
      LEFT JOIN formulas f ON i.dyeType = f.mainDye
      LEFT JOIN orders o ON o.formulaId = f.id
      WHERE i.currentStock < i.safeThreshold
      GROUP BY i.id
      ORDER BY usageCount DESC, i.currentStock ASC
      LIMIT 3
    `).all();
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/orders-trend', (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const trend = db.prepare(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM orders
      WHERE status = 'completed' AND createdAt >= ?
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `).all(thirtyDaysAgo.toISOString());
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/popular-formulas', (req, res) => {
  try {
    const formulas = db.prepare(`
      SELECT 
        f.id,
        f.name,
        f.colorFrom,
        f.colorTo,
        COUNT(o.id) as usageCount
      FROM formulas f
      LEFT JOIN orders o ON o.formulaId = f.id
      GROUP BY f.id
      ORDER BY usageCount DESC
      LIMIT 5
    `).all();
    res.json(formulas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/orders-by-status', (req, res) => {
  try {
    const statusCounts = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();
    
    const statusMap = {
      pending: '待确认',
      confirmed: '已确认',
      soaking: '浸泡中',
      extracting: '萃取中',
      dyeing: '染色中',
      fixing: '固色中',
      washing: '洗净晾干中',
      inspecting: '质检中',
      completed: '已完成'
    };
    
    const result = statusCounts.map(item => ({
      name: statusMap[item.status] || item.status,
      value: item.count
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
