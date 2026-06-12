import express, { Request, Response } from 'express'
import cors from 'cors'
import db, { initDB } from './db'
import type { CoffeeBean, Recipe, GreenBeanBatch, CartItem, SortField, SortOrder } from '../src/types'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

initDB()

app.get('/api/coffee-beans', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const offset = (page - 1) * limit

  const rows = db.prepare('SELECT * FROM coffee_beans LIMIT ? OFFSET ?').all(limit, offset) as any[]
  const countRow = db.prepare('SELECT COUNT(*) as total FROM coffee_beans').get() as { total: number }

  const beans: CoffeeBean[] = rows.map(row => ({
    ...row,
    flavorNotes: JSON.parse(row.flavorNotes),
    roastLevels: JSON.parse(row.roastLevels),
    flavorProfile: JSON.parse(row.flavorProfile),
  }))

  res.json({ data: beans, total: countRow.total, page, limit })
})

app.get('/api/coffee-beans/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM coffee_beans WHERE id = ?').get(req.params.id) as any
  if (!row) return res.status(404).json({ error: 'Coffee bean not found' })

  const bean: CoffeeBean = {
    ...row,
    flavorNotes: JSON.parse(row.flavorNotes),
    roastLevels: JSON.parse(row.roastLevels),
    flavorProfile: JSON.parse(row.flavorProfile),
  }
  res.json(bean)
})

app.get('/api/recipes', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM recipes ORDER BY createdAt DESC').all() as any[]
  const recipes: Recipe[] = rows.map(row => ({
    ...row,
    controlPoints: JSON.parse(row.controlPoints),
  }))
  res.json(recipes)
})

app.get('/api/recipes/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as any
  if (!row) return res.status(404).json({ error: 'Recipe not found' })

  const recipe: Recipe = {
    ...row,
    controlPoints: JSON.parse(row.controlPoints),
  }
  res.json(recipe)
})

app.post('/api/recipes', (req: Request, res: Response) => {
  const { name, beanOrigin, beanBatchId, greenBeanWeight, roastedBeanWeight, controlPoints } = req.body
  const yieldRate = (roastedBeanWeight / greenBeanWeight) * 100
  const chargeTemp = controlPoints[0]?.temperature || 180
  const dropTemp = controlPoints[controlPoints.length - 1]?.temperature || 210
  const firstCrackTime = controlPoints.find((p: any) => p.temperature >= 200)?.time || 10

  const info = db.prepare(`
    INSERT INTO recipes 
    (name, beanOrigin, beanBatchId, greenBeanWeight, roastedBeanWeight, yieldRate, chargeTemp, firstCrackTime, dropTemp, controlPoints) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, beanOrigin, beanBatchId || null, greenBeanWeight, roastedBeanWeight,
    yieldRate, chargeTemp, firstCrackTime, dropTemp, JSON.stringify(controlPoints)
  )

  if (beanBatchId) {
    db.prepare('UPDATE green_bean_batches SET remainingWeight = remainingWeight - ? WHERE id = ?')
      .run(greenBeanWeight / 1000, beanBatchId)
  }

  res.json({ id: info.lastInsertRowid, yieldRate, chargeTemp, firstCrackTime, dropTemp })
})

app.put('/api/recipes/:id', (req: Request, res: Response) => {
  const { name, beanOrigin, beanBatchId, greenBeanWeight, roastedBeanWeight, controlPoints } = req.body
  const yieldRate = (roastedBeanWeight / greenBeanWeight) * 100
  const chargeTemp = controlPoints[0]?.temperature || 180
  const dropTemp = controlPoints[controlPoints.length - 1]?.temperature || 210
  const firstCrackTime = controlPoints.find((p: any) => p.temperature >= 200)?.time || 10

  const info = db.prepare(`
    UPDATE recipes SET 
      name = ?, beanOrigin = ?, beanBatchId = ?, greenBeanWeight = ?, roastedBeanWeight = ?, 
      yieldRate = ?, chargeTemp = ?, firstCrackTime = ?, dropTemp = ?, controlPoints = ?
    WHERE id = ?
  `).run(
    name, beanOrigin, beanBatchId || null, greenBeanWeight, roastedBeanWeight,
    yieldRate, chargeTemp, firstCrackTime, dropTemp, JSON.stringify(controlPoints),
    req.params.id
  )

  if (info.changes === 0) return res.status(404).json({ error: 'Recipe not found' })
  res.json({ success: true, yieldRate, chargeTemp, firstCrackTime, dropTemp })
})

app.delete('/api/recipes/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Recipe not found' })
  res.json({ success: true })
})

app.get('/api/green-bean-batches', (req: Request, res: Response) => {
  const sortBy = (req.query.sortBy as SortField) || 'receiveDate'
  const sortOrder = (req.query.sortOrder as SortOrder) || 'desc'

  const validSortFields: SortField[] = ['origin', 'processing', 'receiveDate']
  const field = validSortFields.includes(sortBy) ? sortBy : 'receiveDate'
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

  const rows = db.prepare(`SELECT * FROM green_bean_batches ORDER BY ${field} ${order}`).all() as GreenBeanBatch[]
  const lowStockCount = rows.filter(b => b.remainingWeight < b.threshold).length

  res.json({ data: rows, lowStockCount })
})

app.post('/api/green-bean-batches', (req: Request, res: Response) => {
  const { batchNo, origin, processing, variety, initialWeight, receiveDate, threshold } = req.body
  const info = db.prepare(`
    INSERT INTO green_bean_batches 
    (batchNo, origin, processing, variety, initialWeight, remainingWeight, receiveDate, threshold) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(batchNo, origin, processing, variety, initialWeight, initialWeight, receiveDate, threshold || 10)

  res.json({ id: info.lastInsertRowid })
})

app.put('/api/green-bean-batches/:id', (req: Request, res: Response) => {
  const { batchNo, origin, processing, variety, initialWeight, remainingWeight, receiveDate, threshold } = req.body
  const info = db.prepare(`
    UPDATE green_bean_batches SET 
      batchNo = ?, origin = ?, processing = ?, variety = ?, 
      initialWeight = ?, remainingWeight = ?, receiveDate = ?, threshold = ?
    WHERE id = ?
  `).run(batchNo, origin, processing, variety, initialWeight, remainingWeight, receiveDate, threshold, req.params.id)

  if (info.changes === 0) return res.status(404).json({ error: 'Batch not found' })
  res.json({ success: true })
})

app.get('/api/orders', (req: Request, res: Response) => {
  const orderRows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all() as any[]
  const itemRows = db.prepare('SELECT * FROM order_items').all() as any[]

  const orders = orderRows.map(o => ({
    ...o,
    items: itemRows.filter(i => i.orderId === o.id),
  }))

  res.json(orders)
})

app.post('/api/orders', (req: Request, res: Response) => {
  const { items, total, customerName } = req.body
  const info = db.prepare('INSERT INTO orders (customerName, total) VALUES (?, ?)').run(customerName || null, total)
  const orderId = info.lastInsertRowid

  const insertItem = db.prepare(`
    INSERT INTO order_items (orderId, coffeeId, roastLevel, quantity, price) 
    VALUES (?, ?, ?, ?, ?)
  `)

  items.forEach((item: CartItem) => {
    insertItem.run(orderId, item.coffeeId, item.roastLevel, item.quantity, item.price)
    db.prepare('UPDATE coffee_beans SET stockRoasted = stockRoasted - ? WHERE id = ?')
      .run(item.quantity * 0.25, item.coffeeId)
  })

  res.json({ id: orderId })
})

app.listen(PORT, () => {
  console.log(`Coffee Studio Server running on http://localhost:${PORT}`)
})
