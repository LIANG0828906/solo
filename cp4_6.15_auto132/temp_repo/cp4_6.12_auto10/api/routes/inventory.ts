import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/init.js'
import type {
  GreenwareStock,
  RawMaterialStock,
  FinishedProduct,
  MaterialWarning,
} from '../../shared/types.js'

const router = Router()

function buildGreenwareFromRow(row: any): GreenwareStock {
  return {
    id: row.id,
    clayType: row.clay_type,
    vesselType: row.vessel_type,
    quantity: row.quantity,
    shelfArea: row.shelf_area,
  }
}

function buildMaterialFromRow(row: any): RawMaterialStock {
  return {
    id: row.id,
    material: row.material,
    currentStock: row.current_stock,
    minThreshold: row.min_threshold,
  }
}

function buildFinishedFromRow(row: any): FinishedProduct {
  return {
    id: row.id,
    orderId: row.order_id,
    glazeId: row.glaze_id,
    firingBatchId: row.firing_batch_id,
    caliber: row.caliber,
    height: row.height,
    weight: row.weight,
    qualityRating: row.quality_rating,
    photoUrl: row.photo_url || '',
    createdAt: row.created_at,
  }
}

const MATERIAL_NAMES: Record<string, string> = {
  feldspar: '长石',
  quartz: '石英',
  kaolin: '高岭土',
  limestone: '石灰石',
  iron_oxide: '氧化铁',
  cobalt_oxide: '氧化钴',
}

router.get('/greenware', (_req: Request, res: Response): void => {
  const rows = db
    .prepare('SELECT * FROM greenware_stock ORDER BY shelf_area, clay_type')
    .all() as any[]
  const data: GreenwareStock[] = rows.map(buildGreenwareFromRow)
  res.json({ success: true, data })
})

router.post('/greenware', (req: Request, res: Response): void => {
  const { id, clayType, vesselType, quantity, shelfArea } = req.body

  if (!clayType || !vesselType || quantity === undefined || !shelfArea) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }

  if (id) {
    const existing = db.prepare('SELECT * FROM greenware_stock WHERE id = ?').get(id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '记录不存在' })
      return
    }
    db.prepare(`
      UPDATE greenware_stock
      SET clay_type = ?, vessel_type = ?, quantity = ?, shelf_area = ?
      WHERE id = ?
    `).run(clayType, vesselType, quantity, shelfArea, id)
  } else {
    const newId = uuidv4()
    db.prepare(`
      INSERT INTO greenware_stock (id, clay_type, vessel_type, quantity, shelf_area)
      VALUES (?, ?, ?, ?, ?)
    `).run(newId, clayType, vesselType, quantity, shelfArea)
  }

  const rows = db
    .prepare('SELECT * FROM greenware_stock ORDER BY shelf_area, clay_type')
    .all() as any[]
  const data: GreenwareStock[] = rows.map(buildGreenwareFromRow)
  res.json({ success: true, data })
})

router.get('/materials', (_req: Request, res: Response): void => {
  const rows = db
    .prepare('SELECT * FROM raw_material_stock ORDER BY material')
    .all() as any[]
  const data: RawMaterialStock[] = rows.map(buildMaterialFromRow)
  res.json({ success: true, data })
})

router.post('/materials', (req: Request, res: Response): void => {
  const { id, material, currentStock, minThreshold } = req.body

  if (!material || currentStock === undefined || minThreshold === undefined) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }

  if (id) {
    const existing = db.prepare('SELECT * FROM raw_material_stock WHERE id = ?').get(id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '记录不存在' })
      return
    }
    db.prepare(`
      UPDATE raw_material_stock
      SET material = ?, current_stock = ?, min_threshold = ?
      WHERE id = ?
    `).run(material, currentStock, minThreshold, id)
  } else {
    const newId = uuidv4()
    db.prepare(`
      INSERT INTO raw_material_stock (id, material, current_stock, min_threshold)
      VALUES (?, ?, ?, ?)
    `).run(newId, material, currentStock, minThreshold)
  }

  const rows = db
    .prepare('SELECT * FROM raw_material_stock ORDER BY material')
    .all() as any[]
  const data: RawMaterialStock[] = rows.map(buildMaterialFromRow)
  res.json({ success: true, data })
})

router.get('/finished', (_req: Request, res: Response): void => {
  const rows = db
    .prepare('SELECT * FROM finished_products ORDER BY created_at DESC')
    .all() as any[]
  const data: FinishedProduct[] = rows.map(buildFinishedFromRow)
  res.json({ success: true, data })
})

router.post('/finished', (req: Request, res: Response): void => {
  const {
    orderId = null,
    glazeId = null,
    firingBatchId = null,
    caliber,
    height,
    weight,
    qualityRating,
    photoUrl = '',
  } = req.body

  if (caliber === undefined || height === undefined || weight === undefined || !qualityRating) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO finished_products (id, order_id, glaze_id, firing_batch_id, caliber, height, weight, quality_rating, photo_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, orderId, glazeId, firingBatchId, caliber, height, weight, qualityRating, photoUrl, now)

  const row = db.prepare('SELECT * FROM finished_products WHERE id = ?').get(id) as any
  const data = buildFinishedFromRow(row)
  res.status(201).json({ success: true, data })
})

router.get('/warnings', (_req: Request, res: Response): void => {
  const rows = db
    .prepare('SELECT * FROM raw_material_stock WHERE current_stock < min_threshold')
    .all() as any[]

  const warnings: MaterialWarning[] = rows.map((row) => ({
    id: row.id,
    material: row.material,
    materialName: MATERIAL_NAMES[row.material] || row.material,
    currentStock: row.current_stock,
    minThreshold: row.min_threshold,
  }))

  res.json({ success: true, data: warnings })
})

export default router
