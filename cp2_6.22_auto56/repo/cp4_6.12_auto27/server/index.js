import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, 'pottery.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    base_price REAL NOT NULL,
    clay_types TEXT NOT NULL,
    glaze_colors TEXT NOT NULL,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    current_stock REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    threshold REAL NOT NULL DEFAULT 10,
    consumption_30d REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    clay_type TEXT NOT NULL,
    glaze_color TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    reference_images TEXT,
    special_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    total_price REAL NOT NULL,
    clay_used REAL DEFAULT 0,
    glaze_used REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS process_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    assignee TEXT,
    completed_at TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS firing_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    firing_type TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    temp_curve TEXT,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`)

const checkMaterials = db.prepare('SELECT COUNT(*) as count FROM materials')
if (checkMaterials.get().count === 0) {
  const insertMaterial = db.prepare(
    'INSERT INTO materials (name, type, current_stock, unit, threshold, consumption_30d) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const materials = [
    ['白瓷泥', 'clay', 25, 'kg', 20, 18],
    ['粗陶泥', 'clay', 15, 'kg', 20, 22],
    ['紫砂泥', 'clay', 8, 'kg', 15, 10],
    ['炻器泥', 'clay', 30, 'kg', 20, 15],
    ['青釉', 'glaze', 5, 'L', 8, 6],
    ['天目釉', 'glaze', 12, 'L', 8, 5],
    ['铁锈釉', 'glaze', 3, 'L', 8, 7],
    ['结晶釉', 'glaze', 10, 'L', 8, 4],
    ['裂纹釉', 'glaze', 2, 'L', 8, 8],
  ]
  const insertMany = db.transaction((arr) => {
    for (const m of arr) insertMaterial.run(...m)
  })
  insertMany(materials)
}

const checkProducts = db.prepare('SELECT COUNT(*) as count FROM products')
if (checkProducts.get().count === 0) {
  const insertProduct = db.prepare(
    'INSERT INTO products (name, category, description, base_price, clay_types, glaze_colors, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const products = [
    ['手工茶杯', '杯子', '匠人手工拉坯，器型圆润，握感舒适，容量约200ml', 88, '白瓷,粗陶,紫砂,炻器', '青釉,天目釉,铁锈釉,结晶釉,裂纹釉', 'cup'],
    ['陶制汤碗', '碗', '经典圆腹造型，适合盛汤盛饭，釉面温润', 128, '白瓷,粗陶,炻器', '青釉,铁锈釉,结晶釉', 'bowl'],
    ['艺术花瓶', '花瓶', '手工拉坯成型，线条优雅，适合插花装饰', 288, '白瓷,粗陶,紫砂,炻器', '青釉,天目釉,铁锈釉,结晶釉,裂纹釉', 'vase'],
    ['紫砂茶壶', '茶壶', '传统紫砂工艺，透气性好，茶香四溢', 388, '紫砂', '结晶釉', 'teapot'],
    ['装饰摆件', '摆件', '独特造型设计，家居装饰佳品，每件独一无二', 168, '白瓷,粗陶,紫砂,炻器', '青釉,天目釉,铁锈釉,结晶釉,裂纹釉', 'decor'],
  ]
  const insertMany = db.transaction((arr) => {
    for (const p of arr) insertProduct.run(...p)
  })
  insertMany(products)
}

const PROCESS_STEPS = ['揉泥', '拉坯/注浆', '修坯', '素烧', '上釉', '釉烧', '冷却开窑']
const STEP_CLAY_USAGE = 0.3
const STEP_GLAZE_USAGE = 0.05

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

function parseProduct(p) {
  return {
    ...p,
    clay_types: (p.clay_types || '').split(',').filter(Boolean),
    glaze_colors: (p.glaze_colors || '').split(',').filter(Boolean),
  }
}

app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products').all()
    res.json(products.map(parseProduct))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/products/:id', (req, res) => {
  try {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!p) return res.status(404).json({ error: '产品不存在' })
    res.json(parseProduct(p))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/materials', (req, res) => {
  try {
    const materials = db.prepare('SELECT * FROM materials').all()
    const warnings = materials.filter((m) => m.current_stock < m.threshold)
    res.json({ materials, warnings, warningCount: warnings.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/materials/export-csv', (req, res) => {
  try {
    const ids = (req.query.ids || '').toString().split(',').filter(Boolean)
    let materials
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',')
      materials = db.prepare(`SELECT * FROM materials WHERE id IN (${placeholders})`).all(...ids)
    } else {
      materials = db.prepare('SELECT * FROM materials WHERE current_stock < threshold').all()
    }
    const withAdvice = materials.map((m) => ({
      ...m,
      suggested_amount: Math.ceil((m.threshold - m.current_stock + m.consumption_30d * 1.5) * 10) / 10,
    }))
    const header = '材料名称,类型,当前库存,单位,警戒阈值,近30天消耗,建议补货量'
    const rows = withAdvice.map(
      (m) => `${m.name},${m.type === 'clay' ? '泥料' : '釉料'},${m.current_stock},${m.unit},${m.threshold},${m.consumption_30d},${m.suggested_amount}`
    )
    const csv = '\uFEFF' + [header, ...rows].join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=purchase-order.csv')
    res.send(csv)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/materials/:id/restock', (req, res) => {
  try {
    const { amount } = req.body
    db.prepare('UPDATE materials SET current_stock = current_stock + ? WHERE id = ?').run(amount, req.params.id)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/orders', (req, res) => {
  try {
    const page = parseInt(req.query.page || '1')
    const pageSize = parseInt(req.query.pageSize || '20')
    const offset = (page - 1) * pageSize
    const total = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
    const orders = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(pageSize, offset)
    const withSteps = orders.map((o) => {
      const steps = db.prepare('SELECT * FROM process_steps WHERE order_id = ? ORDER BY id').all(o.id)
      return { ...o, steps, reference_images: o.reference_images ? JSON.parse(o.reference_images) : [] }
    })
    res.json({ total, page, pageSize, data: withSteps })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/orders/:id', (req, res) => {
  try {
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    if (!o) return res.status(404).json({ error: '订单不存在' })
    const steps = db.prepare('SELECT * FROM process_steps WHERE order_id = ? ORDER BY id').all(o.id)
    const firings = db.prepare('SELECT * FROM firing_records WHERE order_id = ? ORDER BY id').all(o.id)
    res.json({
      ...o,
      steps,
      firings: firings.map((f) => ({ ...f, temp_curve: f.temp_curve ? JSON.parse(f.temp_curve) : [] })),
      reference_images: o.reference_images ? JSON.parse(o.reference_images) : [],
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/orders', (req, res) => {
  try {
    const { product_id, product_name, quantity, clay_type, glaze_color, customer_name, customer_phone, customer_email, reference_images, special_notes, total_price } = req.body
    const result = db.prepare(
      `INSERT INTO orders (product_id, product_name, quantity, clay_type, glaze_color, customer_name, customer_phone, customer_email, reference_images, special_notes, total_price, clay_used, glaze_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      product_id,
      product_name,
      quantity,
      clay_type,
      glaze_color,
      customer_name,
      customer_phone || '',
      customer_email || '',
      JSON.stringify(reference_images || []),
      special_notes || '',
      total_price,
      (STEP_CLAY_USAGE * quantity).toFixed(2),
      (STEP_GLAZE_USAGE * quantity).toFixed(2)
    )
    const orderId = result.lastInsertRowid
    const insertStep = db.prepare('INSERT INTO process_steps (order_id, step_name, status) VALUES (?, ?, ?)')
    const tx = db.transaction(() => {
      for (const step of PROCESS_STEPS) {
        insertStep.run(orderId, step, 'pending')
      }
    })
    tx()
    res.json({ id: orderId, success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body
    db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(status, req.params.id)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/orders/:id/steps/:stepId', (req, res) => {
  try {
    const { status, assignee } = req.body
    const step = db.prepare('SELECT * FROM process_steps WHERE id = ? AND order_id = ?').get(req.params.stepId, req.params.id)
    if (!step) return res.status(404).json({ error: '工序不存在' })

    let completed_at = step.completed_at
    if (status === 'completed' && !step.completed_at) {
      completed_at = new Date().toLocaleString('zh-CN', { hour12: false })
    }
    if (status === 'pending') {
      completed_at = null
    }

    db.prepare(
      'UPDATE process_steps SET status = ?, assignee = COALESCE(?, assignee), completed_at = ? WHERE id = ?'
    ).run(status, assignee || null, completed_at, req.params.stepId)

    if (step.step_name === '上釉' && status === 'completed' && step.status !== 'completed') {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
      if (order) {
        db.prepare(`UPDATE materials SET current_stock = MAX(0, current_stock - ?) WHERE name = ? AND type = 'clay'`).run(order.clay_used, order.clay_type)
        db.prepare(`UPDATE materials SET current_stock = MAX(0, current_stock - ?) WHERE name = ? AND type = 'glaze'`).run(order.glaze_used, order.glaze_color)
      }
    }

    const steps = db.prepare('SELECT * FROM process_steps WHERE order_id = ? ORDER BY id').all(req.params.id)
    res.json({ success: true, steps })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/firings', (req, res) => {
  try {
    const { order_id, firing_type, start_time, end_time, temp_curve, notes } = req.body
    const result = db.prepare(
      `INSERT INTO firing_records (order_id, firing_type, start_time, end_time, temp_curve, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      order_id || null,
      firing_type,
      start_time || null,
      end_time || null,
      JSON.stringify(temp_curve || []),
      notes || ''
    )
    res.json({ id: result.lastInsertRowid, success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/firings', (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM firing_records ORDER BY id DESC LIMIT 50').all()
    res.json(records.map((f) => ({ ...f, temp_curve: f.temp_curve ? JSON.parse(f.temp_curve) : [] })))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/stats', (req, res) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
    const pendingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`).get().count
    const makingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'making'`).get().count
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_price), 0) as sum FROM orders WHERE status IN (\'shipped\', \'completed\')').get().sum
    res.json({ totalOrders, pendingOrders, makingOrders, totalRevenue })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`陶艺工作室 API 服务运行在 http://localhost:${PORT}`)
})
