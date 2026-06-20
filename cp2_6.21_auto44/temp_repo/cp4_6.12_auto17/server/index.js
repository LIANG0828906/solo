const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.join(__dirname, 'database.db');
let db;

function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('保存数据库失败:', err);
  }
}

async function initDatabase() {
  const SQL = await initSqlJs();
  let fileBuffer = null;
  try {
    if (fs.existsSync(dbPath)) {
      fileBuffer = fs.readFileSync(dbPath);
    }
  } catch (err) {
    console.warn('读取数据库文件失败，将创建新数据库:', err.message);
  }
  db = new SQL.Database(fileBuffer);

  db.exec(`
    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grid_data TEXT NOT NULL,
      colors TEXT NOT NULL,
      thumbnail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      pattern_id INTEGER NOT NULL,
      pattern_name TEXT NOT NULL,
      size_length REAL NOT NULL,
      size_width REAL NOT NULL,
      yarn_type TEXT NOT NULL,
      color_scheme TEXT NOT NULL,
      tassel_style TEXT DEFAULT 'none',
      estimated_yarn REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      status_history TEXT DEFAULT '[]',
      expected_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pattern_id) REFERENCES patterns(id)
    );

    CREATE TABLE IF NOT EXISTS yarn_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      yarn_type TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'g',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const yarnTypes = ['wool', 'cashmere', 'cotton', 'linen'];
  const yarnNames = { wool: '羊毛', cashmere: '羊绒', cotton: '棉线', linen: '亚麻' };
  const defaultColors = ['#D2B48C', '#8B7355', '#6B4E3D', '#FAF0E6', '#A67C52', '#C4A484'];
  for (const type of yarnTypes) {
    for (const color of defaultColors) {
      const key = `${type}_${color}`;
      const name = yarnNames[type] + '-' + color;
      const qty = 500 + Math.random() * 500;
      db.run('INSERT OR IGNORE INTO yarn_inventory (yarn_type, color, quantity) VALUES (?, ?, ?)', [key, name, qty]);
    }
  }

  saveDatabase();
}

const YARN_COEFFICIENTS = {
  wool: 1.0,
  cashmere: 0.9,
  cotton: 1.1,
  linen: 1.2
};

function calculateYarnEstimate(gridData, sizeLength, sizeWidth, yarnType) {
  let totalStitches = 0;
  if (Array.isArray(gridData)) {
    gridData.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(cell => {
          if (cell && cell.stitch !== 0) totalStitches++;
        });
      }
    });
  }
  const stitchWeight = totalStitches * 0.15;
  const areaWeight = (sizeLength * sizeWidth) * 0.08;
  const coefficient = YARN_COEFFICIENTS[yarnType] || 1.0;
  return Math.round((stitchWeight + areaWeight) * coefficient * 10) / 10;
}

app.get('/api/patterns', async (req, res) => {
  try {
    const patterns = db.prepare('SELECT id, name, thumbnail, colors, created_at FROM patterns ORDER BY created_at DESC').allAsObject();
    res.json(patterns.map(p => ({
      ...p,
      colors: JSON.parse(p.colors)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patterns/:id', async (req, res) => {
  try {
    const pattern = db.prepare('SELECT * FROM patterns WHERE id = ?').getAsObject([req.params.id]);
    if (!pattern) return res.status(404).json({ error: '图案不存在' });
    pattern.grid_data = JSON.parse(pattern.grid_data);
    pattern.colors = JSON.parse(pattern.colors);
    res.json(pattern);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patterns', async (req, res) => {
  try {
    const { name, grid_data, colors, thumbnail } = req.body;
    if (!name || !grid_data || !colors) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    db.run(
      'INSERT INTO patterns (name, grid_data, colors, thumbnail, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [name, JSON.stringify(grid_data), JSON.stringify(colors), thumbnail || null]
    );
    const lastId = db.prepare('SELECT last_insert_rowid() as id').getAsObject().id;
    const pattern = db.prepare('SELECT * FROM patterns WHERE id = ?').getAsObject([lastId]);
    pattern.grid_data = JSON.parse(pattern.grid_data);
    pattern.colors = JSON.parse(pattern.colors);
    res.status(201).json(pattern);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patterns/:id', async (req, res) => {
  try {
    const { name, grid_data, colors, thumbnail } = req.body;
    db.run(
      'UPDATE patterns SET name = ?, grid_data = ?, colors = ?, thumbnail = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, JSON.stringify(grid_data), JSON.stringify(colors), thumbnail || null, req.params.id]
    );
    const pattern = db.prepare('SELECT * FROM patterns WHERE id = ?').getAsObject([req.params.id]);
    if (!pattern) return res.status(404).json({ error: '图案不存在' });
    pattern.grid_data = JSON.parse(pattern.grid_data);
    pattern.colors = JSON.parse(pattern.colors);
    res.json(pattern);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patterns/:id', async (req, res) => {
  try {
    db.run('DELETE FROM patterns WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM orders').getAsObject().count;

    const orders = db.prepare(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).allAsObject([limit, offset]);

    const processedOrders = orders.map(o => ({
      ...o,
      color_scheme: JSON.parse(o.color_scheme),
      status_history: JSON.parse(o.status_history)
    }));

    res.json({
      data: processedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').getAsObject([req.params.id]);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    order.color_scheme = JSON.parse(order.color_scheme);
    order.status_history = JSON.parse(order.status_history);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      customer_name, customer_phone, pattern_id, pattern_name,
      size_length, size_width, yarn_type, color_scheme, tassel_style
    } = req.body;

    if (!customer_name || !pattern_id || !size_length || !size_width || !yarn_type || !color_scheme) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const pattern = db.prepare('SELECT grid_data FROM patterns WHERE id = ?').getAsObject([pattern_id]);
    if (!pattern) return res.status(404).json({ error: '图案不存在' });

    const gridData = JSON.parse(pattern.grid_data);
    const estimated_yarn = calculateYarnEstimate(gridData, size_length, size_width, yarn_type);

    const orderNo = 'WD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 14);

    const initialHistory = JSON.stringify([{
      status: 'pending',
      timestamp: new Date().toISOString(),
      note: '订单创建'
    }]);

    db.run(
      `INSERT INTO orders (
        order_no, customer_name, customer_phone, pattern_id, pattern_name,
        size_length, size_width, yarn_type, color_scheme, tassel_style,
        estimated_yarn, status, status_history, expected_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)`,
      [
        orderNo, customer_name, customer_phone || '', pattern_id, pattern_name,
        size_length, size_width, yarn_type, JSON.stringify(color_scheme), tassel_style || 'none',
        estimated_yarn, initialHistory, expectedDate.toISOString().split('T')[0]
      ]
    );

    const lastId = db.prepare('SELECT last_insert_rowid() as id').getAsObject().id;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').getAsObject([lastId]);
    order.color_scheme = JSON.parse(order.color_scheme);
    order.status_history = JSON.parse(order.status_history);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ error: '缺少状态字段' });

    const order = db.prepare('SELECT status_history FROM orders WHERE id = ?').getAsObject([req.params.id]);
    if (!order) return res.status(404).json({ error: '订单不存在' });

    const history = JSON.parse(order.status_history);
    history.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || ''
    });

    db.run('UPDATE orders SET status = ?, status_history = ? WHERE id = ?', [
      status, JSON.stringify(history), req.params.id
    ]);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').getAsObject([req.params.id]);
    updated.color_scheme = JSON.parse(updated.color_scheme);
    updated.status_history = JSON.parse(updated.status_history);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/status', async (req, res) => {
  try {
    const { ids, status, note } = req.body;
    if (!ids || !ids.length || !status) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const placeholders = ids.map(() => '?').join(',');

    const orders = db.prepare(`SELECT id, status_history FROM orders WHERE id IN (${placeholders})`).allAsObject(ids);

    for (const order of orders) {
      const history = JSON.parse(order.status_history);
      history.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || '批量更新'
      });
      db.run('UPDATE orders SET status = ?, status_history = ? WHERE id = ?', [
        status, JSON.stringify(history), order.id
      ]);
    }

    res.json({ success: true, updatedCount: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/yarn', async (req, res) => {
  try {
    const inventory = db.prepare('SELECT * FROM yarn_inventory ORDER BY yarn_type').allAsObject();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/yarn/check', async (req, res) => {
  try {
    const { yarn_type, colors, estimated_amount } = req.body;
    if (!yarn_type || !colors || !estimated_amount) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const perColor = estimated_amount / colors.length;
    const results = [];

    for (const color of colors) {
      const key = `${yarn_type}_${color}`;
      const item = db.prepare('SELECT * FROM yarn_inventory WHERE yarn_type = ?').getAsObject([key]);
      results.push({
        color,
        required: Math.round(perColor * 10) / 10,
        available: item ? item.quantity : 0,
        sufficient: item ? item.quantity >= perColor : false
      });
    }

    const allSufficient = results.every(r => r.sufficient);
    res.json({ sufficient: allSufficient, details: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDatabase().then(() => {
  setInterval(saveDatabase, 30000);

  app.listen(PORT, () => {
    console.log(`编织工坊服务器已启动: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
