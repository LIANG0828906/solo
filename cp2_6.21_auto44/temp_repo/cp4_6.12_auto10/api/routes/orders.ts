import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/init.js'
import type {
  Order,
  OrderStatus,
  StatusHistoryItem,
} from '../../shared/types.js'

const router = Router()

function buildOrderFromRow(row: any, historyRows: any[]): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    vesselType: row.vessel_type,
    caliber: row.caliber,
    height: row.height,
    baseDiameter: row.base_diameter,
    referenceImages: row.reference_images ? JSON.parse(row.reference_images) : [],
    clayType: row.clay_type,
    notes: row.notes || '',
    status: row.status,
    statusHistory: historyRows
      .map((h) => ({
        status: h.status,
        timestamp: h.timestamp,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    createdAt: row.created_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  const { status } = req.query
  let sql = 'SELECT * FROM orders'
  const params: any[] = []
  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }
  sql += ' ORDER BY created_at DESC'
  const rows = db.prepare(sql).all(...params) as any[]
  const orders: Order[] = rows.map((row) => {
    const historyRows = db
      .prepare('SELECT * FROM order_status_history WHERE order_id = ?')
      .all(row.id) as any[]
    return buildOrderFromRow(row, historyRows)
  })
  res.json({ success: true, data: orders })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any
  if (!row) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }
  const historyRows = db
    .prepare('SELECT * FROM order_status_history WHERE order_id = ?')
    .all(id) as any[]
  const order = buildOrderFromRow(row, historyRows)
  res.json({ success: true, data: order })
})

router.post('/', (req: Request, res: Response): void => {
  const {
    customerName,
    customerPhone,
    vesselType,
    caliber,
    height,
    baseDiameter,
    referenceImages = [],
    clayType,
    notes = '',
  } = req.body

  if (!customerName || !customerPhone || !vesselType || !clayType) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString()
  const initialStatus: OrderStatus = 'pending'

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_name, customer_phone, vessel_type, caliber, height, base_diameter, reference_images, clay_type, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertHistory = db.prepare(`
    INSERT INTO order_status_history (order_id, status, timestamp)
    VALUES (?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    insertOrder.run(
      id,
      customerName,
      customerPhone,
      vesselType,
      caliber,
      height,
      baseDiameter,
      JSON.stringify(referenceImages),
      clayType,
      notes,
      initialStatus,
      now,
    )
    insertHistory.run(id, initialStatus, now)
  })
  transaction()

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any
  const historyRows = db
    .prepare('SELECT * FROM order_status_history WHERE order_id = ?')
    .all(id) as any[]
  const order = buildOrderFromRow(row, historyRows)

  res.status(201).json({ success: true, data: order })
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status } = req.body as { status: OrderStatus }

  if (!status) {
    res.status(400).json({ success: false, error: '缺少 status 字段' })
    return
  }

  const validStatuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'preparing',
    'throwing',
    'trimming',
    'bisque',
    'glaze',
    'polishing',
    'completed',
  ]
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: '无效的订单状态' })
    return
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  const now = new Date().toISOString()

  const transaction = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id)
    db.prepare(
      'INSERT INTO order_status_history (order_id, status, timestamp) VALUES (?, ?, ?)',
    ).run(id, status, now)
  })
  transaction()

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any
  const historyRows = db
    .prepare('SELECT * FROM order_status_history WHERE order_id = ?')
    .all(id) as any[]
  const order = buildOrderFromRow(row, historyRows)

  res.json({ success: true, data: order })
})

export default router
