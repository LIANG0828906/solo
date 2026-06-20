import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/init.js'
import type { GlazeFormula } from '../../shared/types.js'

const router = Router()

function buildGlazeFromRow(row: any, ingredientRows: any[]): GlazeFormula {
  return {
    id: row.id,
    name: row.name,
    baseType: row.base_type,
    ingredients: ingredientRows.map((i) => ({
      material: i.material,
      percentage: i.percentage,
    })),
    targetTempMin: row.target_temp_min,
    targetTempMax: row.target_temp_max,
    heatingCurve: row.heating_curve || '',
    holdingTime: row.holding_time,
  }
}

router.get('/', (_req: Request, res: Response): void => {
  const rows = db.prepare('SELECT * FROM glaze_formulas ORDER BY name').all() as any[]
  const glazes: GlazeFormula[] = rows.map((row) => {
    const ingredientRows = db
      .prepare('SELECT * FROM glaze_ingredients WHERE glaze_id = ?')
      .all(row.id) as any[]
    return buildGlazeFromRow(row, ingredientRows)
  })
  res.json({ success: true, data: glazes })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM glaze_formulas WHERE id = ?').get(id) as any
  if (!row) {
    res.status(404).json({ success: false, error: '配方不存在' })
    return
  }
  const ingredientRows = db
    .prepare('SELECT * FROM glaze_ingredients WHERE glaze_id = ?')
    .all(id) as any[]
  const glaze = buildGlazeFromRow(row, ingredientRows)
  res.json({ success: true, data: glaze })
})

router.post('/', (req: Request, res: Response): void => {
  const {
    name,
    baseType,
    ingredients,
    targetTempMin,
    targetTempMax,
    heatingCurve = '',
    holdingTime,
  } = req.body

  if (!name || !baseType || !ingredients || !targetTempMin || !targetTempMax || !holdingTime) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }

  const totalPct = ingredients.reduce((sum: number, ing: any) => sum + (ing.percentage || 0), 0)
  if (Math.abs(totalPct - 100) > 0.01) {
    res.status(400).json({ success: false, error: `配料百分比总和必须为100%，当前为${totalPct}%` })
    return
  }

  const id = uuidv4()

  const insertGlaze = db.prepare(`
    INSERT INTO glaze_formulas (id, name, base_type, target_temp_min, target_temp_max, heating_curve, holding_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertIngredient = db.prepare(`
    INSERT INTO glaze_ingredients (glaze_id, material, percentage)
    VALUES (?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    insertGlaze.run(id, name, baseType, targetTempMin, targetTempMax, heatingCurve, holdingTime)
    for (const ing of ingredients) {
      insertIngredient.run(id, ing.material, ing.percentage)
    }
  })
  transaction()

  const row = db.prepare('SELECT * FROM glaze_formulas WHERE id = ?').get(id) as any
  const ingredientRows = db
    .prepare('SELECT * FROM glaze_ingredients WHERE glaze_id = ?')
    .all(id) as any[]
  const glaze = buildGlazeFromRow(row, ingredientRows)

  res.status(201).json({ success: true, data: glaze })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const {
    name,
    baseType,
    ingredients,
    targetTempMin,
    targetTempMax,
    heatingCurve,
    holdingTime,
  } = req.body

  const existing = db.prepare('SELECT * FROM glaze_formulas WHERE id = ?').get(id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '配方不存在' })
    return
  }

  if (ingredients) {
    const totalPct = ingredients.reduce((sum: number, ing: any) => sum + (ing.percentage || 0), 0)
    if (Math.abs(totalPct - 100) > 0.01) {
      res.status(400).json({ success: false, error: `配料百分比总和必须为100%，当前为${totalPct}%` })
      return
    }
  }

  const updateGlaze = db.prepare(`
    UPDATE glaze_formulas
    SET name = COALESCE(?, name),
        base_type = COALESCE(?, base_type),
        target_temp_min = COALESCE(?, target_temp_min),
        target_temp_max = COALESCE(?, target_temp_max),
        heating_curve = COALESCE(?, heating_curve),
        holding_time = COALESCE(?, holding_time)
    WHERE id = ?
  `)

  const transaction = db.transaction(() => {
    updateGlaze.run(
      name ?? null,
      baseType ?? null,
      targetTempMin ?? null,
      targetTempMax ?? null,
      heatingCurve ?? null,
      holdingTime ?? null,
      id,
    )
    if (ingredients) {
      db.prepare('DELETE FROM glaze_ingredients WHERE glaze_id = ?').run(id)
      const insertIngredient = db.prepare(`
        INSERT INTO glaze_ingredients (glaze_id, material, percentage)
        VALUES (?, ?, ?)
      `)
      for (const ing of ingredients) {
        insertIngredient.run(id, ing.material, ing.percentage)
      }
    }
  })
  transaction()

  const row = db.prepare('SELECT * FROM glaze_formulas WHERE id = ?').get(id) as any
  const ingredientRows = db
    .prepare('SELECT * FROM glaze_ingredients WHERE glaze_id = ?')
    .all(id) as any[]
  const glaze = buildGlazeFromRow(row, ingredientRows)

  res.json({ success: true, data: glaze })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM glaze_formulas WHERE id = ?').get(id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '配方不存在' })
    return
  }

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM glaze_ingredients WHERE glaze_id = ?').run(id)
    db.prepare('DELETE FROM glaze_formulas WHERE id = ?').run(id)
  })
  transaction()

  res.json({ success: true, data: { id } })
})

export default router
