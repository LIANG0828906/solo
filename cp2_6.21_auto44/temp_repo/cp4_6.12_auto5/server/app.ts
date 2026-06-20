import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { db, Plant, Order, CareRecord } from './database';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/plants', (_req, res) => {
  const plants = db.prepare('SELECT * FROM plants ORDER BY created_at DESC').all() as Plant[];
  res.json(plants);
});

app.get('/api/plants/:id', (req, res) => {
  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id) as Plant | undefined;
  if (!plant) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  res.json(plant);
});

app.post('/api/plants', (req, res) => {
  const { name, description, price_monthly, stock, image, water_cycle_days } = req.body;
  if (!name || price_monthly === undefined || stock === undefined) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO plants (id, name, description, price_monthly, stock, image, water_cycle_days, last_watered, last_fertilized, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)
  `).run(id, name, description || '', price_monthly, stock, image || '', water_cycle_days || 7, now);

  if (stock < 3) {
    const careId = uuidv4();
    db.prepare(`
      INSERT INTO care_records (id, plant_id, type, notes, created_at)
      VALUES (?, ?, 'prune', ?, ?)
    `).run(careId, id, `【补货提醒】库存仅余${stock}盆，建议及时补货`, now);
  }

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(id) as Plant;
  res.status(201).json(plant);
});

app.patch('/api/plants/:id', (req, res) => {
  const { name, description, price_monthly, stock, image, water_cycle_days, last_watered, last_fertilized } = req.body;
  const existing = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id) as Plant | undefined;
  if (!existing) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  db.prepare(`
    UPDATE plants SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price_monthly = COALESCE(?, price_monthly),
      stock = COALESCE(?, stock),
      image = COALESCE(?, image),
      water_cycle_days = COALESCE(?, water_cycle_days),
      last_watered = ?,
      last_fertilized = ?
    WHERE id = ?
  `).run(
    name ?? null,
    description ?? null,
    price_monthly ?? null,
    stock ?? null,
    image ?? null,
    water_cycle_days ?? null,
    last_watered ?? existing.last_watered,
    last_fertilized ?? existing.last_fertilized,
    req.params.id
  );

  if (stock !== undefined && stock < 3) {
    const existingReminder = db.prepare(
      "SELECT * FROM care_records WHERE plant_id = ? AND type = 'prune' AND notes LIKE '%补货提醒%' ORDER BY created_at DESC LIMIT 1"
    ).get(req.params.id) as CareRecord | undefined;
    
    if (!existingReminder || Date.now() - new Date(existingReminder.created_at).getTime() > 24 * 60 * 60 * 1000) {
      const careId = uuidv4();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO care_records (id, plant_id, type, notes, created_at)
        VALUES (?, ?, 'prune', ?, ?)
      `).run(careId, req.params.id, `【补货提醒】库存仅余${stock}盆，建议及时补货`, now);
    }
  }

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id) as Plant;
  res.json(plant);
});

app.get('/api/orders', (_req, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name as plant_name, p.image as plant_image 
    FROM orders o 
    LEFT JOIN plants p ON o.plant_id = p.id 
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { plant_id, customer_name, phone, address, rental_period } = req.body;
  if (!plant_id || !customer_name || !phone || !address || !rental_period) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(plant_id) as Plant | undefined;
  if (!plant) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  if (plant.stock <= 0) {
    res.status(400).json({ error: '该植物库存不足' });
    return;
  }
  const periodMultiplier = rental_period === '1month' ? 1 : rental_period === '3months' ? 3 : 6;
  const total_price = plant.price_monthly * periodMultiplier * (periodMultiplier >= 3 ? 0.9 : 1);

  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO orders (id, plant_id, customer_name, phone, address, rental_period, total_price, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, plant_id, customer_name, phone, address, rental_period, total_price, now, now);

  db.prepare('UPDATE plants SET stock = stock - 1 WHERE id = ?').run(plant_id);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order;
  res.status(201).json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'accepted', 'delivering', 'renting', 'returned', 'completed'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: '无效的订单状态' });
    return;
  }
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order | undefined;
  if (!existing) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);

  if (status === 'returned' || status === 'completed') {
    db.prepare('UPDATE plants SET stock = stock + 1 WHERE id = ?').run(existing.plant_id);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order;
  res.json(order);
});

app.get('/api/plants/:id/care-records', (req, res) => {
  const records = db.prepare(
    'SELECT * FROM care_records WHERE plant_id = ? ORDER BY created_at DESC'
  ).all(req.params.id) as CareRecord[];
  res.json(records);
});

app.get('/api/care-records', (_req, res) => {
  const records = db.prepare(`
    SELECT cr.*, p.name as plant_name 
    FROM care_records cr 
    LEFT JOIN plants p ON cr.plant_id = p.id 
    ORDER BY cr.created_at DESC
  `).all();
  res.json(records);
});

app.post('/api/plants/:id/care-records', (req, res) => {
  const { type, notes } = req.body;
  const validTypes = ['water', 'fertilize', 'prune', 'repot'];
  if (!type || !validTypes.includes(type)) {
    res.status(400).json({ error: '无效的养护类型' });
    return;
  }
  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id) as Plant | undefined;
  if (!plant) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO care_records (id, plant_id, type, notes, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.id, type, notes || '', now);

  if (type === 'water') {
    db.prepare('UPDATE plants SET last_watered = ? WHERE id = ?').run(now, req.params.id);
  } else if (type === 'fertilize') {
    db.prepare('UPDATE plants SET last_fertilized = ? WHERE id = ?').run(now, req.params.id);
  }

  const record = db.prepare('SELECT * FROM care_records WHERE id = ?').get(id) as CareRecord;
  res.status(201).json(record);
});

app.get('/api/purchase-suggestions', (_req, res) => {
  const lowStockPlants = db.prepare('SELECT * FROM plants WHERE stock < 2').all() as Plant[];
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString();

  const suggestions = lowStockPlants.map(plant => {
    const orders = db.prepare(
      "SELECT * FROM orders WHERE plant_id = ? AND created_at >= ?"
    ).all(plant.id, threeMonthsAgoStr) as Order[];
    
    const now = new Date();
    const monthlyCount: Record<string, number> = {};
    
    for (let i = 0; i < 3; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      monthlyCount[key] = 0;
    }

    orders.forEach(order => {
      const d = new Date(order.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyCount[key] !== undefined) {
        monthlyCount[key]++;
      }
    });

    const months = Object.keys(monthlyCount).sort();
    const lastMonthCount = monthlyCount[months[1]] || 0;
    const avgMonthly = Math.round(orders.length / 3);
    const suggestedPurchase = Math.max(3, avgMonthly * 2);

    return {
      plant_id: plant.id,
      plant_name: plant.name,
      current_stock: plant.stock,
      monthly_counts: monthlyCount,
      last_month_count: lastMonthCount,
      avg_monthly: avgMonthly,
      suggested_purchase: suggestedPurchase,
      suggestion: `${plant.name}近3个月平均每月租赁${avgMonthly}次，上月租赁${lastMonthCount}次，建议采购${suggestedPurchase}盆`
    };
  });

  res.json(suggestions);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
