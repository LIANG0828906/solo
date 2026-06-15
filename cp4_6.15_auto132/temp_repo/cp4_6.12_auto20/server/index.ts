import express, { Request, Response } from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保数据目录存在
const dataDir = path.resolve(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'workshop.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ================= 建表 =================

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    scene_style TEXT NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    depth REAL NOT NULL,
    detail_level TEXT NOT NULL,
    has_lighting INTEGER NOT NULL DEFAULT 0,
    reference_images TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    inspiration_ids TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle',
    last_maintenance_date TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS borrow_records (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    borrower TEXT NOT NULL,
    borrowed_at TEXT NOT NULL,
    returned_at TEXT,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS inspirations (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock REAL NOT NULL DEFAULT 0,
    safe_stock REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT '件',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

// ================= 工具函数 =================

const now = () => new Date().toISOString()

const parseJson = <T>(val: string | null, fallback: T): T => {
  if (!val) return fallback
  try {
    return JSON.parse(val) as T
  } catch {
    return fallback
  }
}

// ================= 订单数据映射 =================

type OrderRow = {
  id: string
  customer_name: string
  customer_email: string
  scene_style: string
  width: number
  height: number
  depth: number
  detail_level: string
  has_lighting: number
  reference_images: string
  status: string
  inspiration_ids: string
  created_at: string
  updated_at: string
}

const mapOrder = (row: OrderRow) => {
  const historyRows = db
    .prepare('SELECT status, timestamp FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC')
    .all(row.id) as { status: string; timestamp: string }[]

  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    sceneStyle: row.scene_style,
    width: row.width,
    height: row.height,
    depth: row.depth,
    detailLevel: row.detail_level,
    hasLighting: row.has_lighting === 1,
    referenceImages: parseJson<string[]>(row.reference_images, []),
    status: row.status,
    statusHistory: historyRows,
    inspirationIds: parseJson<string[]>(row.inspiration_ids, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ================= 工具数据映射 =================

type ToolRow = {
  id: string
  name: string
  type: string
  status: string
  last_maintenance_date: string | null
  created_at: string
}

const mapTool = (row: ToolRow) => {
  const records = db
    .prepare('SELECT id, borrower, borrowed_at, returned_at FROM borrow_records WHERE tool_id = ? ORDER BY borrowed_at DESC')
    .all(row.id) as { id: string; borrower: string; borrowed_at: string; returned_at: string | null }[]

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    lastMaintenanceDate: row.last_maintenance_date,
    borrowRecords: records,
    createdAt: row.created_at,
  }
}

// ================= 服务初始化 =================

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))
const PORT = 3001

// ================= 订单 API =================

app.get('/api/orders', (req: Request, res: Response) => {
  const { status } = req.query
  let rows: OrderRow[]
  if (status) {
    rows = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status) as OrderRow[]
  } else {
    rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as OrderRow[]
  }
  res.json(rows.map(mapOrder))
})

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined
  if (!row) return res.status(404).json({ error: '订单不存在' })
  res.json(mapOrder(row))
})

app.post('/api/orders', (req: Request, res: Response) => {
  const { customerName, customerEmail, sceneStyle, width, height, depth, detailLevel, hasLighting, referenceImages } =
    req.body
  const id = uuidv4()
  const ts = now()
  db.prepare(
    `INSERT INTO orders (id, customer_name, customer_email, scene_style, width, height, depth, detail_level, has_lighting, reference_images, status, inspiration_ids, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '[]', ?, ?)`
  ).run(
    id,
    customerName,
    customerEmail,
    sceneStyle,
    width,
    height,
    depth,
    detailLevel,
    hasLighting ? 1 : 0,
    JSON.stringify(referenceImages || []),
    ts,
    ts
  )
  // 记录初始状态历史
  db.prepare('INSERT INTO order_status_history (id, order_id, status, timestamp) VALUES (?, ?, ?, ?)').run(
    uuidv4(),
    id,
    'pending',
    ts
  )
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow
  res.status(201).json(mapOrder(row))
})

app.post('/api/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body
  const ts = now()
  const info = db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, ts, req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '订单不存在' })
  db.prepare('INSERT INTO order_status_history (id, order_id, status, timestamp) VALUES (?, ?, ?, ?)').run(
    uuidv4(),
    req.params.id,
    status,
    ts
  )
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow
  res.json(mapOrder(row))
})

app.post('/api/orders/:id/inspirations', (req: Request, res: Response) => {
  const { inspirationId } = req.body
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined
  if (!row) return res.status(404).json({ error: '订单不存在' })
  const ids = parseJson<string[]>(row.inspiration_ids, [])
  if (!ids.includes(inspirationId)) ids.push(inspirationId)
  const ts = now()
  db.prepare('UPDATE orders SET inspiration_ids = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(ids),
    ts,
    req.params.id
  )
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow
  res.json(mapOrder(updated))
})

app.delete('/api/orders/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '订单不存在' })
  res.status(204).send()
})

// ================= 工具 API =================

app.get('/api/tools', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM tools ORDER BY created_at DESC').all() as ToolRow[]
  res.json(rows.map(mapTool))
})

app.get('/api/tools/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as ToolRow | undefined
  if (!row) return res.status(404).json({ error: '工具不存在' })
  res.json(mapTool(row))
})

app.post('/api/tools', (req: Request, res: Response) => {
  const { name, type, status = 'idle', lastMaintenanceDate = null } = req.body
  const id = uuidv4()
  const ts = now()
  db.prepare(
    'INSERT INTO tools (id, name, type, status, last_maintenance_date, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, type, status, lastMaintenanceDate, ts)
  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as ToolRow
  res.status(201).json(mapTool(row))
})

app.put('/api/tools/:id', (req: Request, res: Response) => {
  const { name, type, status, lastMaintenanceDate } = req.body
  const existing = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as ToolRow | undefined
  if (!existing) return res.status(404).json({ error: '工具不存在' })
  db.prepare(
    'UPDATE tools SET name = ?, type = ?, status = ?, last_maintenance_date = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    type ?? existing.type,
    status ?? existing.status,
    lastMaintenanceDate !== undefined ? lastMaintenanceDate : existing.last_maintenance_date,
    req.params.id
  )
  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as ToolRow
  res.json(mapTool(row))
})

app.post('/api/tools/:id/borrow', (req: Request, res: Response) => {
  const { borrower } = req.body
  const existing = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as ToolRow | undefined
  if (!existing) return res.status(404).json({ error: '工具不存在' })
  const ts = now()
  db.prepare('UPDATE tools SET status = ? WHERE id = ?').run('borrowed', req.params.id)
  db.prepare(
    'INSERT INTO borrow_records (id, tool_id, borrower, borrowed_at, returned_at) VALUES (?, ?, ?, ?, NULL)'
  ).run(uuidv4(), req.params.id, borrower, ts)
  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as ToolRow
  res.json(mapTool(row))
})

app.post('/api/tools/:id/return', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as ToolRow | undefined
  if (!existing) return res.status(404).json({ error: '工具不存在' })
  const ts = now()
  db.prepare('UPDATE tools SET status = ? WHERE id = ?').run('idle', req.params.id)
  db.prepare('UPDATE borrow_records SET returned_at = ? WHERE tool_id = ? AND returned_at IS NULL').run(
    ts,
    req.params.id
  )
  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as ToolRow
  res.json(mapTool(row))
})

app.delete('/api/tools/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '工具不存在' })
  res.status(204).send()
})

// ================= 灵感图 API =================

app.get('/api/inspirations', (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM inspirations ORDER BY created_at DESC')
    .all() as { id: string; url: string; label: string; created_at: string }[]
  res.json(
    rows.map((r) => ({
      id: r.id,
      url: r.url,
      label: r.label,
      createdAt: r.created_at,
    }))
  )
})

app.post('/api/inspirations', (req: Request, res: Response) => {
  const { url, label } = req.body
  const id = uuidv4()
  const ts = now()
  db.prepare('INSERT INTO inspirations (id, url, label, created_at) VALUES (?, ?, ?, ?)').run(id, url, label, ts)
  res.status(201).json({ id, url, label, createdAt: ts })
})

app.delete('/api/inspirations/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM inspirations WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '灵感图不存在' })
  res.status(204).send()
})

// ================= 材料 API =================

type MaterialRow = {
  id: string
  name: string
  category: string
  stock: number
  safe_stock: number
  unit: string
  created_at: string
  updated_at: string
}

const mapMaterial = (r: MaterialRow) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  stock: r.stock,
  safeStock: r.safe_stock,
  unit: r.unit,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

app.get('/api/materials', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM materials ORDER BY category, name').all() as MaterialRow[]
  res.json(rows.map(mapMaterial))
})

app.get('/api/materials/low-stock', (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM materials WHERE stock < safe_stock ORDER BY category, name')
    .all() as MaterialRow[]
  res.json(rows.map(mapMaterial))
})

app.post('/api/materials', (req: Request, res: Response) => {
  const { name, category, stock, safeStock, unit = '件' } = req.body
  const id = uuidv4()
  const ts = now()
  db.prepare(
    'INSERT INTO materials (id, name, category, stock, safe_stock, unit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, category, stock, safeStock, unit, ts, ts)
  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as MaterialRow
  res.status(201).json(mapMaterial(row))
})

app.put('/api/materials/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id) as MaterialRow | undefined
  if (!existing) return res.status(404).json({ error: '材料不存在' })
  const { name, category, stock, safeStock, unit } = req.body
  const ts = now()
  db.prepare(
    'UPDATE materials SET name = ?, category = ?, stock = ?, safe_stock = ?, unit = ?, updated_at = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    category ?? existing.category,
    stock ?? existing.stock,
    safeStock ?? existing.safe_stock,
    unit ?? existing.unit,
    ts,
    req.params.id
  )
  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id) as MaterialRow
  res.json(mapMaterial(row))
})

app.delete('/api/materials/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '材料不存在' })
  res.status(204).send()
})

// ================= 统计 API =================

app.get('/api/stats', (_req: Request, res: Response) => {
  const pendingOrders = (db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'").get() as { c: number }).c
  const activeOrders = (
    db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status NOT IN ('pending', 'completed')").get() as { c: number }
  ).c
  const borrowedTools = (db.prepare("SELECT COUNT(*) AS c FROM tools WHERE status = 'borrowed'").get() as { c: number }).c
  const lowStockMaterials = (
    db.prepare('SELECT COUNT(*) AS c FROM materials WHERE stock < safe_stock').get() as { c: number }
  ).c
  res.json({ pendingOrders, activeOrders, borrowedTools, lowStockMaterials })
})

// ================= 启动服务 =================

app.listen(PORT, () => {
  console.log(`[workshop-api] Server running on http://localhost:${PORT}`)
})
