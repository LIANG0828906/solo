import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { db, ExpenseRecord, ExpenseCategory } from '../db.js'

const router = Router()

const validCategories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'other']

function isValidCategory(category: string): category is ExpenseCategory {
  return validCategories.includes(category as ExpenseCategory)
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const records = [...db.data.records].sort((a, b) => {
      return moment(b.date).valueOf() - moment(a.date).valueOf()
    })
    res.json(records)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch records' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const record = db.data.records.find((r: ExpenseRecord) => r.id === req.params.id)
    if (!record) {
      res.status(404).json({ error: 'Record not found' })
      return
    }
    res.json(record)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch record' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, category, note, date } = req.body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' })
      return
    }

    if (!category || !isValidCategory(category)) {
      res.status(400).json({ error: 'Invalid category' })
      return
    }

    const now = moment().toISOString()
    const recordDate = date ? moment(date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')

    const newRecord: ExpenseRecord = {
      id: uuidv4(),
      amount,
      category,
      note: note || '',
      date: recordDate,
      createdAt: now,
      updatedAt: now,
    }

    await db.read()
    db.data.records.push(newRecord)
    await db.write()

    res.status(201).json(newRecord)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create record' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const index = db.data.records.findIndex((r: ExpenseRecord) => r.id === req.params.id)

    if (index === -1) {
      res.status(404).json({ error: 'Record not found' })
      return
    }

    const { amount, category, note, date } = req.body
    const existing = db.data.records[index]

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      res.status(400).json({ error: 'Invalid amount' })
      return
    }

    if (category !== undefined && !isValidCategory(category)) {
      res.status(400).json({ error: 'Invalid category' })
      return
    }

    const updatedRecord: ExpenseRecord = {
      ...existing,
      amount: amount ?? existing.amount,
      category: category ?? existing.category,
      note: note ?? existing.note,
      date: date ? moment(date).format('YYYY-MM-DD') : existing.date,
      updatedAt: moment().toISOString(),
    }

    db.data.records[index] = updatedRecord
    await db.write()

    res.json(updatedRecord)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update record' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const initialLength = db.data.records.length
    db.data.records = db.data.records.filter((r: ExpenseRecord) => r.id !== req.params.id)

    if (db.data.records.length === initialLength) {
      res.status(404).json({ error: 'Record not found' })
      return
    }

    await db.write()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete record' })
  }
})

export default router
