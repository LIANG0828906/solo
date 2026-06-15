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

const db = new Database(path.join(__dirname, 'mosaic.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shape TEXT NOT NULL,
    color TEXT NOT NULL,
    color_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 20,
    batch_note TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    tiles_json TEXT NOT NULL,
    total_tiles INTEGER NOT NULL DEFAULT 0,
    current_status TEXT NOT NULL DEFAULT '待确认',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

const COLORS = [
  '#FF0000', '#FF6B6B', '#FF8C00', '#FFD700',
  '#FFFF00', '#9ACD32', '#32CD32', '#00FF00',
  '#00FA9A', '#00CED1', '#00BFFF', '#1E90FF',
  '#4169E1', '#0000FF', '#6A5ACD', '#8A2BE2',
  '#9400D3', '#FF00FF', '#FF1493', '#FF69B4',
  '#8B4513', '#A0522D', '#D2691E', '#DEB887',
];

const COLOR_NAMES: Record<string, string> = {
  '#FF0000': '大红', '#FF6B6B': '浅红', '#FF8C00': '深橙', '#FFD700': '金色',
  '#FFFF00': '明黄', '#9ACD32': '黄绿', '#32CD32': '酸橙绿', '#00FF00': '鲜绿',
  '#00FA9A': '中海绿', '#00CED1': '深青', '#00BFFF': '深天蓝', '#1E90FF': '道奇蓝',
  '#4169E1': '皇家蓝', '#0000FF': '纯蓝', '#6A5ACD': '板岩蓝', '#8A2BE2': '蓝紫罗兰',
  '#9400D3': '暗紫', '#FF00FF': '品红', '#FF1493': '深粉', '#FF69B4': '热粉',
  '#8B4513': '马鞍棕', '#A0522D': '赭色', '#D2691E': '巧克力', '#DEB887': '驼色',
};

const SHAPES = ['square', 'circle', 'triangle', 'hexagon'];

const initInventory = db.prepare('SELECT COUNT(*) as count FROM inventory');
const countResult = initInventory.get() as { count: number };

if (countResult.count === 0) {
  const insertInv = db.prepare(
    'INSERT INTO inventory (shape, color, color_name, quantity, threshold) VALUES (?, ?, ?, ?, ?)'
  );
  const quantities = [150, 120, 8, 45, 200, 30, 180, 5, 60, 90];
  let idx = 0;
  for (const shape of SHAPES) {
    for (const color of COLORS) {
      const qty = quantities[idx % quantities.length];
      insertInv.run(shape, color, COLOR_NAMES[color] || color, qty, 20);
      idx++;
    }
  }
  console.log('初始化库存数据完成');
}

const deductInventory = (shape: string, color: string, amount: number) => {
  const stmt = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE shape = ? AND color = ?');
  stmt.run(amount, shape, color);
};

const addOrderStatus = (orderId: number, status: string, note?: string) => {
  const stmt = db.prepare(
    'INSERT INTO order_statuses (order_id, status, note) VALUES (?, ?, ?)'
  );
  stmt.run(orderId, status, note || null);

  const updateStmt = db.prepare('UPDATE orders SET current_status = ? WHERE id = ?');
  updateStmt.run(status, orderId);
};

app.get('/api/inventory', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, shape, color, color_name as colorName, quantity, threshold, batch_note as batchNote
      FROM inventory ORDER BY quantity ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/inventory/low-stock', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, shape, color, color_name as colorName, quantity, threshold, batch_note as batchNote
      FROM inventory WHERE quantity < threshold ORDER BY quantity ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, threshold, batchNote } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(quantity);
    }
    if (threshold !== undefined) {
      fields.push('threshold = ?');
      values.push(threshold);
    }
    if (batchNote !== undefined) {
      fields.push('batch_note = ?');
      values.push(batchNote);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: '没有可更新的字段' });
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const row = db.prepare(`
      SELECT id, shape, color, color_name as colorName, quantity, threshold, batch_note as batchNote
      FROM inventory WHERE id = ?
    `).get(id);

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, customer_name as customerName, customer_email as customerEmail,
             tiles_json as tilesJson, total_tiles as totalTiles,
             current_status as currentStatus, created_at as createdAt
      FROM orders ORDER BY created_at DESC
    `).all() as any[];

    const orders = rows.map((row) => {
      let tiles = [];
      try {
        tiles = JSON.parse(row.tilesJson || '[]');
      } catch (e) {
        tiles = [];
      }

      const statuses = db.prepare(`
        SELECT status, timestamp, note FROM order_statuses
        WHERE order_id = ? ORDER BY timestamp ASC
      `).all(row.id);

      return {
        id: row.id,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        tiles,
        totalTiles: row.totalTiles,
        currentStatus: row.currentStatus,
        createdAt: row.createdAt,
        statuses,
      };
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT id, customer_name as customerName, customer_email as customerEmail,
             tiles_json as tilesJson, total_tiles as totalTiles,
             current_status as currentStatus, created_at as createdAt
      FROM orders WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: '订单不存在' });
    }

    let tiles = [];
    try {
      tiles = JSON.parse(row.tilesJson || '[]');
    } catch (e) {
      tiles = [];
    }

    const statuses = db.prepare(`
      SELECT status, timestamp, note FROM order_statuses
      WHERE order_id = ? ORDER BY timestamp ASC
    `).all(id);

    res.json({
      id: row.id,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      tiles,
      totalTiles: row.totalTiles,
      currentStatus: row.currentStatus,
      createdAt: row.createdAt,
      statuses,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { tiles, customerName, customerEmail } = req.body;

    if (!tiles || !Array.isArray(tiles) || tiles.length === 0) {
      return res.status(400).json({ error: '订单瓷砖数据无效' });
    }
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: '客户姓名不能为空' });
    }

    const tilesJson = JSON.stringify(tiles);
    const totalTiles = tiles.length;

    const stmt = db.prepare(`
      INSERT INTO orders (customer_name, customer_email, tiles_json, total_tiles, current_status)
      VALUES (?, ?, ?, ?, '待确认')
    `);
    const result = stmt.run(customerName.trim(), customerEmail?.trim() || null, tilesJson, totalTiles);
    const orderId = Number(result.lastInsertRowid);

    addOrderStatus(orderId, '待确认');

    const row = db.prepare(`
      SELECT id, customer_name as customerName, customer_email as customerEmail,
             tiles_json as tilesJson, total_tiles as totalTiles,
             current_status as currentStatus, created_at as createdAt
      FROM orders WHERE id = ?
    `).get(orderId) as any;

    let parsedTiles = [];
    try {
      parsedTiles = JSON.parse(row.tilesJson || '[]');
    } catch (e) {
      parsedTiles = [];
    }

    const statuses = db.prepare(`
      SELECT status, timestamp, note FROM order_statuses
      WHERE order_id = ? ORDER BY timestamp ASC
    `).all(orderId);

    res.status(201).json({
      id: row.id,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      tiles: parsedTiles,
      totalTiles: row.totalTiles,
      currentStatus: row.currentStatus,
      createdAt: row.createdAt,
      statuses,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ error: '状态不能为空' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const validStatuses = [
      '待确认', '已确认', '材料准备', '切割拼接',
      '注浆填缝', '打磨抛光', '质检包装', '已发货'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }

    const existingStatus = db.prepare(
      'SELECT id FROM order_statuses WHERE order_id = ? AND status = ?'
    ).get(id, status);

    if (!existingStatus) {
      addOrderStatus(Number(id), status, note);

      if (status === '已发货' && order.current_status !== '已发货') {
        let tiles = [];
        try {
          tiles = JSON.parse(order.tiles_json || '[]');
        } catch (e) {
          tiles = [];
        }

        const tileCount: Record<string, number> = {};
        tiles.forEach((tile: any) => {
          const key = `${tile.shape}-${tile.color}`;
          tileCount[key] = (tileCount[key] || 0) + 1;
        });

        Object.entries(tileCount).forEach(([key, count]) => {
          const [shape, color] = key.split('-');
          deductInventory(shape, color, count);
        });

        console.log(`订单 #${id} 已发货，已扣减库存`);
      }
    }

    const row = db.prepare(`
      SELECT id, customer_name as customerName, customer_email as customerEmail,
             tiles_json as tilesJson, total_tiles as totalTiles,
             current_status as currentStatus, created_at as createdAt
      FROM orders WHERE id = ?
    `).get(id) as any;

    let parsedTiles = [];
    try {
      parsedTiles = JSON.parse(row.tilesJson || '[]');
    } catch (e) {
      parsedTiles = [];
    }

    const statuses = db.prepare(`
      SELECT status, timestamp, note FROM order_statuses
      WHERE order_id = ? ORDER BY timestamp ASC
    `).all(id);

    res.json({
      id: row.id,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      tiles: parsedTiles,
      totalTiles: row.totalTiles,
      currentStatus: row.currentStatus,
      createdAt: row.createdAt,
      statuses,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '马赛克工作室 API 服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`马赛克工作室后端服务已启动: http://localhost:${PORT}`);
});
