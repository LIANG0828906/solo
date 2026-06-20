import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db, { initDB } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

initDB();

function getNow() {
  return new Date().toISOString();
}

// Orders CRUD
app.get('/api/orders', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string | undefined;
  const offset = (page - 1) * pageSize;

  let whereClause = '';
  const params: any[] = [];
  if (status && status !== 'all') {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }

  const orders = db
    .prepare(`SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);

  const totalResult = db
    .prepare(`SELECT COUNT(*) as count FROM orders ${whereClause}`)
    .get(...params) as { count: number };

  res.json({
    data: orders,
    total: totalResult.count,
    page,
    pageSize
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const { device_model, fault_description, customer_name, customer_phone } = req.body;
  if (!device_model || !fault_description || !customer_name || !customer_phone) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const id = uuidv4();
  const now = getNow();
  db.prepare(
    `INSERT INTO orders (id, device_model, fault_description, customer_name, customer_phone, status, created_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NULL)`
  ).run(id, device_model, fault_description, customer_name, customer_phone, now, now);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json(order);
});

app.put('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const { device_model, fault_description, customer_name, customer_phone, status } = req.body;
  const now = getNow();
  const completed_at = status === 'completed' && order.status !== 'completed' ? now : order.completed_at;

  db.prepare(
    `UPDATE orders SET
      device_model = COALESCE(?, device_model),
      fault_description = COALESCE(?, fault_description),
      customer_name = COALESCE(?, customer_name),
      customer_phone = COALESCE(?, customer_phone),
      status = COALESCE(?, status),
      updated_at = ?,
      completed_at = ?
     WHERE id = ?`
  ).run(
    device_model ?? null,
    fault_description ?? null,
    customer_name ?? null,
    customer_phone ?? null,
    status ?? null,
    now,
    completed_at ?? null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/orders/:id', (req, res) => {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '工单不存在' });
  }
  res.json({ success: true });
});

// Order parts association
app.get('/api/orders/:id/parts', (req, res) => {
  const parts = db.prepare(
    `SELECT op.*, p.name, p.model
     FROM order_parts op
     JOIN parts p ON op.part_id = p.id
     WHERE op.order_id = ?`
  ).all(req.params.id);
  res.json(parts);
});

app.post('/api/orders/:id/parts', (req, res) => {
  const { part_id, quantity } = req.body;
  if (!part_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: '参数错误' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(part_id) as any;
  if (!part) {
    return res.status(404).json({ error: '备件不存在' });
  }

  if (part.quantity < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }

  const now = getNow();
  const id = uuidv4();
  const tx = db.transaction(() => {
    db.prepare('UPDATE parts SET quantity = quantity - ? WHERE id = ?').run(quantity, part_id);
    db.prepare(
      'INSERT INTO order_parts (id, order_id, part_id, quantity, unit_price, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.id, part_id, quantity, part.unit_price, now);
  });
  tx();

  const result = db.prepare(
    `SELECT op.*, p.name, p.model FROM order_parts op JOIN parts p ON op.part_id = p.id WHERE op.id = ?`
  ).get(id);
  res.status(201).json(result);
});

// Parts CRUD
app.get('/api/parts', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 50;
  const offset = (page - 1) * pageSize;

  const parts = db.prepare('SELECT * FROM parts ORDER BY name ASC LIMIT ? OFFSET ?').all(pageSize, offset);
  const totalResult = db.prepare('SELECT COUNT(*) as count FROM parts').get() as { count: number };

  res.json({
    data: parts,
    total: totalResult.count,
    page,
    pageSize
  });
});

app.get('/api/parts/:id', (req, res) => {
  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  if (!part) {
    return res.status(404).json({ error: '备件不存在' });
  }
  res.json(part);
});

app.post('/api/parts', (req, res) => {
  const { name, model, quantity, unit_price } = req.body;
  if (!name || !model) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO parts (id, name, model, quantity, unit_price) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, model, quantity ?? 0, unit_price ?? 0);

  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(id);
  res.status(201).json(part);
});

app.put('/api/parts/:id', (req, res) => {
  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  if (!part) {
    return res.status(404).json({ error: '备件不存在' });
  }

  const { name, model, quantity, unit_price } = req.body;
  db.prepare(
    `UPDATE parts SET
      name = COALESCE(?, name),
      model = COALESCE(?, model),
      quantity = COALESCE(?, quantity),
      unit_price = COALESCE(?, unit_price)
     WHERE id = ?`
  ).run(
    name ?? null,
    model ?? null,
    quantity ?? null,
    unit_price ?? null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/parts/:id', (req, res) => {
  const result = db.prepare('DELETE FROM parts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '备件不存在' });
  }
  res.json({ success: true });
});

// Inventory operations
app.post('/api/parts/:id/stock', (req, res) => {
  const { quantity, operation, order_id } = req.body;
  if (!quantity || quantity <= 0 || !['in', 'out'].includes(operation)) {
    return res.status(400).json({ error: '参数错误' });
  }

  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id) as any;
  if (!part) {
    return res.status(404).json({ error: '备件不存在' });
  }

  if (operation === 'out' && part.quantity < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }

  const newQuantity = operation === 'in' ? part.quantity + quantity : part.quantity - quantity;
  const now = getNow();

  const tx = db.transaction(() => {
    db.prepare('UPDATE parts SET quantity = ? WHERE id = ?').run(newQuantity, req.params.id);
    if (order_id && operation === 'out') {
      const id = uuidv4();
      db.prepare(
        'INSERT INTO order_parts (id, order_id, part_id, quantity, unit_price, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, order_id, req.params.id, quantity, part.unit_price, now);
    }
  });
  tx();

  const updated = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count;

  const completedOrders = db
    .prepare("SELECT created_at, completed_at FROM orders WHERE status = 'completed' AND completed_at IS NOT NULL")
    .all() as { created_at: string; completed_at: string }[];

  let avgRepairTime = 0;
  if (completedOrders.length > 0) {
    const totalTime = completedOrders.reduce((sum, o) => {
      const diff = new Date(o.completed_at).getTime() - new Date(o.created_at).getTime();
      return sum + diff;
    }, 0);
    avgRepairTime = Math.round(totalTime / completedOrders.length / 60000);
  }

  const totalStockValue = (db.prepare(
    'SELECT COALESCE(SUM(quantity * unit_price), 0) as total FROM parts'
  ).get() as { total: number }).total;

  res.json({
    totalOrders,
    avgRepairTime,
    totalStockValue
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
