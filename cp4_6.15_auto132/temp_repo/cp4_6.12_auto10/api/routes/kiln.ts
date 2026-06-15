import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/init.js'
import type { KilnFiring, TemperatureRecord } from '../../shared/types.js'

const router = Router()

function buildKilnFromRow(row: any): KilnFiring {
  return {
    id: row.id,
    batchNumber: row.batch_number,
    glazeIds: row.glaze_ids ? JSON.parse(row.glaze_ids) : [],
    positions: row.positions ? JSON.parse(row.positions) : [],
    startTime: row.start_time,
    targetTemperature: row.target_temperature,
    heatingRate: row.heating_rate,
    holdingDuration: row.holding_duration,
    temperatureRecords: row.temperature_records ? JSON.parse(row.temperature_records) : [],
    status: row.status,
    report: row.report ? JSON.parse(row.report) : undefined,
  }
}

router.get('/', (_req: Request, res: Response): void => {
  const rows = db
    .prepare('SELECT * FROM kiln_firings ORDER BY start_time DESC')
    .all() as any[]
  const firings: KilnFiring[] = rows.map(buildKilnFromRow)
  res.json({ success: true, data: firings })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM kiln_firings WHERE id = ?').get(id) as any
  if (!row) {
    res.status(404).json({ success: false, error: '烧制记录不存在' })
    return
  }
  const firing = buildKilnFromRow(row)
  res.json({ success: true, data: firing })
})

router.post('/', (req: Request, res: Response): void => {
  const {
    glazeIds = [],
    positions = [],
    startTime,
    targetTemperature,
    heatingRate,
    holdingDuration,
  } = req.body

  if (!startTime || !targetTemperature || !heatingRate || !holdingDuration) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }

  const id = uuidv4()
  const date = new Date(startTime)
  const batchNumber = `BATCH-${date.getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  const initialRecords: TemperatureRecord[] = [
    {
      timestamp: startTime,
      temperature: 20,
      remainingMinutes: Math.ceil(((targetTemperature - 20) / heatingRate) * 60 + holdingDuration),
    },
  ]

  db.prepare(`
    INSERT INTO kiln_firings (id, batch_number, glaze_ids, positions, start_time, target_temperature, heating_rate, holding_duration, temperature_records, status, report)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'preparing', NULL)
  `).run(
    id,
    batchNumber,
    JSON.stringify(glazeIds),
    JSON.stringify(positions),
    startTime,
    targetTemperature,
    heatingRate,
    holdingDuration,
    JSON.stringify(initialRecords),
  )

  const row = db.prepare('SELECT * FROM kiln_firings WHERE id = ?').get(id) as any
  const firing = buildKilnFromRow(row)
  res.status(201).json({ success: true, data: firing })
})

router.post('/:id/record', (req: Request, res: Response): void => {
  const { id } = req.params
  const { temperature, remainingMinutes } = req.body

  const existing = db.prepare('SELECT * FROM kiln_firings WHERE id = ?').get(id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '烧制记录不存在' })
    return
  }

  const records: TemperatureRecord[] = existing.temperature_records
    ? JSON.parse(existing.temperature_records)
    : []

  const newRecord: TemperatureRecord = {
    timestamp: new Date().toISOString(),
    temperature,
    remainingMinutes,
  }
  records.push(newRecord)

  let status = existing.status
  if (status === 'preparing' && temperature > 50) status = 'firing'
  if (status === 'firing' && remainingMinutes <= 0) status = 'cooling'

  db.prepare(`
    UPDATE kiln_firings
    SET temperature_records = ?, status = ?
    WHERE id = ?
  `).run(JSON.stringify(records), status, id)

  const row = db.prepare('SELECT * FROM kiln_firings WHERE id = ?').get(id) as any
  const firing = buildKilnFromRow(row)
  res.json({ success: true, data: firing })
})

router.post('/:id/complete', (req: Request, res: Response): void => {
  const { id } = req.params
  const { tempDeviation, colorEffect } = req.body

  const existing = db.prepare('SELECT * FROM kiln_firings WHERE id = ?').get(id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '烧制记录不存在' })
    return
  }

  const report = {
    tempDeviation: tempDeviation || '无偏差分析',
    colorEffect: colorEffect || '无发色评价',
  }

  db.prepare(`
    UPDATE kiln_firings
    SET status = 'completed', report = ?
    WHERE id = ?
  `).run(JSON.stringify(report), id)

  const row = db.prepare('SELECT * FROM kiln_firings WHERE id = ?').get(id) as any
  const firing = buildKilnFromRow(row)
  res.json({ success: true, data: firing })
})

export default router
