import express, { Request, Response } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('只允许 JPG 或 PNG 格式'));
    }
  }
});

app.use('/uploads', express.static(uploadDir));

const dbPath = path.join(__dirname, '..', 'studio.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    jewelry_type TEXT NOT NULL,
    material TEXT NOT NULL,
    engraving TEXT,
    size TEXT NOT NULL,
    deadline DATE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    sketch_image TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    is_final INTEGER DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    threshold REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS material_consumption (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jewelry_type TEXT NOT NULL,
    material TEXT NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory(id)
  );
`);

const initInventory = db.prepare(`SELECT COUNT(*) as count FROM inventory`);
if ((initInventory.get() as any).count === 0) {
  const insertInv = db.prepare(`INSERT INTO inventory (name, category, quantity, unit, threshold) VALUES (?, ?, ?, ?, ?)`);
  insertInv.run('银板', 'silver', 1000, 'g', 500);
  insertInv.run('银丝', 'silver', 800, 'g', 500);
  insertInv.run('银粒', 'silver', 1200, 'g', 500);
  insertInv.run('锉刀', 'tool', 15, '把', 5);
  insertInv.run('砂纸', 'consumable', 50, '张', 20);
  insertInv.run('抛光膏', 'consumable', 25, '盒', 10);

  const insertConsumption = db.prepare(`INSERT INTO material_consumption (jewelry_type, material, inventory_item_id, amount) VALUES (?, ?, ?, ?)`);
  const types = ['ring', 'bracelet', 'pendant', 'earring'];
  const materials = ['925', '999', 'gold-plated'];
  types.forEach(t => {
    const baseAmount = t === 'bracelet' ? 25 : t === 'pendant' ? 12 : t === 'earring' ? 8 : 10;
    materials.forEach(m => {
      insertConsumption.run(t, m, 1, baseAmount);
      insertConsumption.run(t, m, 5, 2);
    });
  });
}

function generateOrderNumber(): string {
  const date = new Date();
  const prefix = 'SS' + date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE order_number LIKE ?`);
  const result = stmt.get(prefix + '%') as any;
  return prefix + (result.count + 1).toString().padStart(3, '0');
}

const STATUSES = [
  { key: 'pending', label: '待审核', color: '#9E9E9E' },
  { key: 'designing', label: '设计中', color: '#64B5F6' },
  { key: 'wax_carving', label: '雕蜡', color: '#FFB74D' },
  { key: 'casting', label: '铸银', color: '#CE93D8' },
  { key: 'polishing', label: '打磨', color: '#FFD54F' },
  { key: 'burnishing', label: '抛光', color: '#4DB6AC' },
  { key: 'qc', label: '质检', color: '#F48FB1' },
  { key: 'completed', label: '已完成', color: '#81C784' }
];

app.get('/api/statuses', (_req: Request, res: Response) => {
  res.json(STATUSES);
});

app.post('/api/orders', upload.single('sketch'), (req: Request, res: Response) => {
  try {
    const { jewelry_type, material, engraving, size, deadline, customer_name, customer_phone, customer_email } = req.body;
    const order_number = generateOrderNumber();
    const sketch_image = req.file ? `/uploads/${req.file.filename}` : null;

    const stmt = db.prepare(`
      INSERT INTO orders (order_number, jewelry_type, material, engraving, size, deadline, customer_name, customer_phone, customer_email, sketch_image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    const result = stmt.run(order_number, jewelry_type, material, engraving || '', size, deadline, customer_name, customer_phone, customer_email || '', sketch_image);

    const historyStmt = db.prepare(`INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)`);
    historyStmt.run(result.lastInsertRowid, 'pending', '订单已提交，等待审核');

    res.status(201).json({ id: result.lastInsertRowid, order_number });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders', (req: Request, res: Response) => {
  const { status, type, startDate, endDate, orderNumber, customer_phone } = req.query;
  let sql = `SELECT * FROM orders WHERE 1=1`;
  const params: any[] = [];

  if (status && status !== 'all') { sql += ` AND status = ?`; params.push(status); }
  if (type && type !== 'all') { sql += ` AND jewelry_type = ?`; params.push(type); }
  if (orderNumber) { sql += ` AND order_number LIKE ?`; params.push(`%${orderNumber}%`); }
  if (customer_phone) { sql += ` AND customer_phone = ?`; params.push(customer_phone); }
  if (startDate) { sql += ` AND DATE(created_at) >= ?`; params.push(startDate); }
  if (endDate) { sql += ` AND DATE(created_at) <= ?`; params.push(endDate); }

  sql += ` ORDER BY created_at DESC`;

  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const history = db.prepare(`SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC`).all(req.params.id);
  const designs = db.prepare(`SELECT * FROM designs WHERE order_id = ? ORDER BY created_at DESC`).all(req.params.id);

  res.json({ ...(order as any), history, designs });
});

app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const { status, note } = req.body;
  const orderId = req.params.id;

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const updateStmt = db.prepare(`UPDATE orders SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  updateStmt.run(status, note || '', orderId);

  const historyStmt = db.prepare(`INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)`);
  const statusInfo = STATUSES.find(s => s.key === status);
  historyStmt.run(orderId, status, note || statusInfo?.label || '状态更新');

  if (status === 'completed') {
    const orderData = order as any;
    const consumptions = db.prepare(`
      SELECT mc.* FROM material_consumption mc
      WHERE mc.jewelry_type = ? AND mc.material IN (
        SELECT CASE 
          WHEN ? = '925银' THEN '925'
          WHEN ? = '999银' THEN '999'
          ELSE 'gold-plated'
        END
      )
    `).all(orderData.jewelry_type, orderData.material, orderData.material);

    const updateInv = db.prepare(`UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    consumptions.forEach((c: any) => {
      updateInv.run(c.amount, c.inventory_item_id);
    });
  }

  res.json({ success: true });
});

app.post('/api/orders/:id/designs', upload.single('design'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: '请上传设计稿' });
  const { description, is_final } = req.body;
  const image_url = `/uploads/${req.file.filename}`;

  if (is_final === '1' || is_final === true) {
    db.prepare(`UPDATE designs SET is_final = 0 WHERE order_id = ?`).run(req.params.id);
  }

  const stmt = db.prepare(`INSERT INTO designs (order_id, image_url, is_final, description) VALUES (?, ?, ?, ?)`);
  const result = stmt.run(req.params.id, image_url, is_final ? 1 : 0, description || '');
  res.status(201).json({ id: result.lastInsertRowid, image_url });
});

app.put('/api/designs/:id/final', (req: Request, res: Response) => {
  const design = db.prepare(`SELECT * FROM designs WHERE id = ?`).get(req.params.id) as any;
  if (!design) return res.status(404).json({ error: '设计稿不存在' });

  db.prepare(`UPDATE designs SET is_final = 0 WHERE order_id = ?`).run(design.order_id);
  db.prepare(`UPDATE designs SET is_final = 1 WHERE id = ?`).run(req.params.id);

  res.json({ success: true });
});

app.delete('/api/designs/:id', (req: Request, res: Response) => {
  const design = db.prepare(`SELECT * FROM designs WHERE id = ?`).get(req.params.id) as any;
  if (design && design.image_url) {
    const filePath = path.join(__dirname, '..', design.image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare(`DELETE FROM designs WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

app.get('/api/inventory', (_req: Request, res: Response) => {
  const items = db.prepare(`SELECT * FROM inventory ORDER BY category, name`).all();
  const lowStock = (items as any[]).filter(i => i.quantity < i.threshold);
  res.json({ items, lowStock });
});

app.post('/api/inventory', (req: Request, res: Response) => {
  const { name, category, quantity, unit, threshold } = req.body;
  try {
    const stmt = db.prepare(`INSERT INTO inventory (name, category, quantity, unit, threshold) VALUES (?, ?, ?, ?, ?)`);
    const result = stmt.run(name, category, quantity, unit, threshold);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', (req: Request, res: Response) => {
  const { name, category, quantity, unit, threshold } = req.body;
  const stmt = db.prepare(`
    UPDATE inventory SET name = ?, category = ?, quantity = ?, unit = ?, threshold = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(name, category, quantity, unit, threshold, req.params.id);
  res.json({ success: true });
});

app.delete('/api/inventory/:id', (req: Request, res: Response) => {
  db.prepare(`DELETE FROM inventory WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

app.get('/api/dashboard/stats', (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayNew = (db.prepare(`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?`).get(today) as any).count;
  const pending = (db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status != 'completed'`).get() as any).count;

  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const soonStmt = db.prepare(`
    SELECT COUNT(*) as count FROM orders
    WHERE status != 'completed'
    AND DATE(deadline) <= ?
    AND DATE(deadline) >= DATE('now')
  `);
  const upcomingDeadlines = (soonStmt.get(threeDaysLater.toISOString().slice(0, 10)) as any).count;

  const ordersByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `).all();

  res.json({
    todayNew,
    pending,
    upcomingDeadlines,
    ordersByStatus
  });
});

app.listen(PORT, () => {
  console.log(`银饰工作室 API 服务运行在 http://localhost:${PORT}`);
});
