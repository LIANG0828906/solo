import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    basePrice REAL NOT NULL,
    modelPath TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leathers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    colorName TEXT NOT NULL,
    texturePreview TEXT NOT NULL,
    priceAdd REAL NOT NULL,
    stock INTEGER NOT NULL,
    minStock INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS thread_colors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hardwares (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    priceAdd REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    orderNo TEXT NOT NULL UNIQUE,
    customerName TEXT NOT NULL,
    customerEmail TEXT NOT NULL,
    productId TEXT NOT NULL,
    leatherId TEXT NOT NULL,
    threadColorId TEXT NOT NULL,
    hardwareId TEXT NOT NULL,
    engraving TEXT NOT NULL,
    configSummary TEXT NOT NULL,
    totalAmount REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'producing', 'inspecting', 'shipped', 'completed')),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (leatherId) REFERENCES leathers(id),
    FOREIGN KEY (threadColorId) REFERENCES thread_colors(id),
    FOREIGN KEY (hardwareId) REFERENCES hardwares(id)
  );

  CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    status TEXT NOT NULL,
    operator TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    recipient TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sentAt TEXT NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
  );
`);

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (id, name, category, basePrice, modelPath)
  VALUES (?, ?, ?, ?, ?)
`);

const insertLeather = db.prepare(`
  INSERT OR IGNORE INTO leathers (id, name, type, color, colorName, texturePreview, priceAdd, stock, minStock)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertThreadColor = db.prepare(`
  INSERT OR IGNORE INTO thread_colors (id, name, color)
  VALUES (?, ?, ?)
`);

const insertHardware = db.prepare(`
  INSERT OR IGNORE INTO hardwares (id, name, type, color, priceAdd)
  VALUES (?, ?, ?, ?, ?)
`);

const initData = db.transaction(() => {
  insertProduct.run('prod-001', '经典钱包', 'wallet', 299, '/models/wallet.glb');
  insertProduct.run('prod-002', '皮质手环', 'bracelet', 129, '/models/bracelet.glb');
  insertProduct.run('prod-003', '简约卡包', 'cardholder', 199, '/models/cardholder.glb');

  insertLeather.run('leather-001', '意大利小牛皮', 'cowhide', '#3E2723', '深棕', '/textures/brown.png', 80, 50, 10);
  insertLeather.run('leather-002', '酒红牛皮', 'cowhide', '#880E4F', '酒红', '/textures/wine.png', 90, 5, 10);
  insertLeather.run('leather-003', '黑色羊皮', 'sheepskin', '#212121', '黑色', '/textures/black.png', 60, 30, 8);
  insertLeather.run('leather-004', '植鞣革原色', 'vegetable', '#FFECB3', '原色', '/textures/vegetable.png', 50, 3, 8);
  insertLeather.run('leather-005', '疯马皮', 'cowhide', '#5D4037', '复古棕', '/textures/crazy.png', 100, 25, 10);
  insertLeather.run('leather-006', '鳄鱼纹牛皮', 'cowhide', '#4E342E', '鳄鱼棕', '/textures/crocodile.png', 150, 15, 5);
  insertLeather.run('leather-007', '蓝色羊皮', 'sheepskin', '#1565C0', '宝蓝', '/textures/blue.png', 70, 20, 8);

  insertThreadColor.run('thread-001', '米白', '#F5F5DC');
  insertThreadColor.run('thread-002', '棕色', '#8B4513');
  insertThreadColor.run('thread-003', '黑色', '#000000');
  insertThreadColor.run('thread-004', '酒红', '#800020');
  insertThreadColor.run('thread-005', '藏青', '#000080');
  insertThreadColor.run('thread-006', '金色', '#FFD700');

  insertHardware.run('hw-001', '黄铜拉链', 'zipper', '#B5A642', 25);
  insertHardware.run('hw-002', '银色拉链', 'zipper', '#C0C0C0', 20);
  insertHardware.run('hw-003', '仿古铜带扣', 'buckle', '#8B6914', 35);
  insertHardware.run('hw-004', '银色带扣', 'buckle', '#E8E8E8', 30);
  insertHardware.run('hw-005', '黑色带扣', 'buckle', '#2A2A2A', 28);
});

initData();

app.get('/api/products', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = db.prepare('SELECT * FROM products').all();
    const leathers = db.prepare('SELECT * FROM leathers').all();
    const threads = db.prepare('SELECT * FROM thread_colors').all();
    const hardwares = db.prepare('SELECT * FROM hardwares').all();

    res.json({
      products,
      leathers,
      threads,
      hardwares
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/leathers', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const leathers = db.prepare('SELECT * FROM leathers').all();
    res.json(leathers);
  } catch (err) {
    next(err);
  }
});

app.get('/api/threads', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const threads = db.prepare('SELECT * FROM thread_colors').all();
    res.json(threads);
  } catch (err) {
    next(err);
  }
});

app.get('/api/hardwares', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const hardwares = db.prepare('SELECT * FROM hardwares').all();
    res.json(hardwares);
  } catch (err) {
    next(err);
  }
});

app.post('/api/orders', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerName, customerEmail, productId, leatherId, threadColorId, hardwareId, engraving } = req.body;

    if (!customerName || !customerEmail || !productId || !leatherId || !threadColorId || !hardwareId) {
      res.status(400).json({ error: '缺少必要字段' });
      return;
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    const leather = db.prepare('SELECT * FROM leathers WHERE id = ?').get(leatherId) as any;
    const thread = db.prepare('SELECT * FROM thread_colors WHERE id = ?').get(threadColorId) as any;
    const hardware = db.prepare('SELECT * FROM hardwares WHERE id = ?').get(hardwareId) as any;

    if (!product || !leather || !thread || !hardware) {
      res.status(400).json({ error: '无效的配置项ID' });
      return;
    }

    const totalAmount = product.basePrice + leather.priceAdd + hardware.priceAdd;
    const configSummary = `产品:${product.name} | 皮料:${leather.name}(${leather.colorName}) | 缝线:${thread.name} | 五金:${hardware.name}${engraving ? ` | 刻字:"${engraving}"` : ''}`;
    const orderNo = `LP${Date.now()}`;
    const now = new Date().toISOString();
    const orderId = uuidv4();

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, orderNo, customerName, customerEmail, productId, leatherId, threadColorId, hardwareId, engraving, configSummary, totalAmount, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    const insertStatusHistory = db.prepare(`
      INSERT INTO order_status_history (orderId, status, operator, timestamp)
      VALUES (?, 'pending', 'system', ?)
    `);

    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, orderId, recipient, type, subject, content, sentAt)
      VALUES (?, ?, ?, 'order_confirm', ?, ?, ?)
    `);

    const createOrderTx = db.transaction(() => {
      insertOrder.run(orderId, orderNo, customerName, customerEmail, productId, leatherId, threadColorId, hardwareId, engraving || '', configSummary, totalAmount, now, now);
      insertStatusHistory.run(orderId, now);
      const notificationId = uuidv4();
      const subject = `订单确认 - ${orderNo}`;
      const content = `尊敬的${customerName}，您好！\n\n您的订单已成功提交，订单号：${orderNo}\n\n配置详情：\n${configSummary}\n\n订单金额：¥${totalAmount.toFixed(2)}\n\n我们会尽快为您处理，感谢您的订购！`;
      insertNotification.run(notificationId, orderId, customerEmail, subject, content, now);
    });

    createOrderTx();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const history = db.prepare('SELECT status, operator, timestamp FROM order_status_history WHERE orderId = ? ORDER BY timestamp ASC').all(orderId);

    res.status(201).json({ ...order, statusHistory: history });
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, sort } = req.query;

    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    const sortDir = sort === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY createdAt ${sortDir}`;

    const orders = db.prepare(query).all(...params);

    const getHistory = db.prepare('SELECT status, operator, timestamp FROM order_status_history WHERE orderId = ? ORDER BY timestamp ASC');
    const ordersWithHistory = orders.map((order: any) => ({
      ...order,
      statusHistory: getHistory.all(order.id)
    }));

    res.json(ordersWithHistory);
  } catch (err) {
    next(err);
  }
});

app.patch('/api/orders/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, operator } = req.body;

    const validStatuses = ['pending', 'producing', 'inspecting', 'shipped', 'completed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: '无效的状态值' });
      return;
    }

    if (!operator) {
      res.status(400).json({ error: '缺少操作人信息' });
      return;
    }

    const existingOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!existingOrder) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }

    const now = new Date().toISOString();

    const updateOrder = db.prepare(`
      UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?
    `);

    const insertStatusHistory = db.prepare(`
      INSERT INTO order_status_history (orderId, status, operator, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, orderId, recipient, type, subject, content, sentAt)
      VALUES (?, ?, ?, 'status_update', ?, ?, ?)
    `);

    const statusLabels: Record<string, string> = {
      pending: '待确认',
      producing: '生产中',
      inspecting: '质检中',
      shipped: '已发货',
      completed: '已完成'
    };

    const updateTx = db.transaction(() => {
      updateOrder.run(status, now, id);
      insertStatusHistory.run(id, status, operator, now);

      if (status !== 'pending') {
        const notificationId = uuidv4();
        const subject = `订单状态更新 - ${existingOrder.orderNo}`;
        const content = `尊敬的${existingOrder.customerName}，您好！\n\n您的订单 ${existingOrder.orderNo} 状态已更新为：${statusLabels[status]}\n\n如有疑问请随时联系我们。`;
        insertNotification.run(notificationId, id, existingOrder.customerEmail, subject, content, now);
      }
    });

    updateTx();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    const history = db.prepare('SELECT status, operator, timestamp FROM order_status_history WHERE orderId = ? ORDER BY timestamp ASC').all(id);

    res.json({ ...order, statusHistory: history });
  } catch (err) {
    next(err);
  }
});

app.get('/api/inventory/alerts', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = db.prepare(`
      SELECT id AS leatherId, name AS leatherName, stock AS currentStock, minStock
      FROM leathers
      WHERE stock < minStock
    `).all();

    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

app.get('/api/notifications', (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const notifications = db.prepare(`
      SELECT n.*, o.orderNo
      FROM notifications n
      LEFT JOIN orders o ON n.orderId = o.id
      WHERE n.sentAt >= ?
      ORDER BY n.sentAt DESC
    `).all(threshold);

    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

app.post('/api/notifications', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, recipient, type, subject, content } = req.body;

    if (!orderId || !recipient || !type || !subject || !content) {
      res.status(400).json({ error: '缺少必要字段' });
      return;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      res.status(400).json({ error: '订单不存在' });
      return;
    }

    const validTypes = ['order_confirm', 'status_update'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: '无效的通知类型' });
      return;
    }

    const notificationId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO notifications (id, orderId, recipient, type, subject, content, sentAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(notificationId, orderId, recipient, type, subject, content, now);

    const notification = db.prepare(`
      SELECT n.*, o.orderNo
      FROM notifications n
      LEFT JOIN orders o ON n.orderId = o.id
      WHERE n.id = ?
    `).get(notificationId);

    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`[Server] 皮具定制平台后端服务已启动`);
  console.log(`[Server] 监听端口: ${PORT}`);
  console.log(`[Server] API地址: http://localhost:${PORT}/api`);
  console.log(`[Server] 数据库路径: ${dbPath}`);
});

export default app;
