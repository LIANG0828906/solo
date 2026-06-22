import { Router, type Request, type Response } from 'express'
import { getRecords, createRecord, updateRecord, deleteRecord } from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const days = parseInt(req.query.days as string) || 30
  const records = getRecords(days)
  res.json({ records })
})

router.post('/', (req: Request, res: Response): void => {
  const { date, project, hours, note } = req.body
  if (!date || !project || !hours) {
    res.status(400).json({ success: false, error: '日期、项目和工时为必填项' })
    return
  }
  if (hours < 0.5 || hours > 24) {
    res.status(400).json({ success: false, error: '工时范围0.5-24' })
    return
  }
  const record = createRecord({ date, project, hours, note: note || '' })
  res.json({ success: true, record })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const record = updateRecord(id, req.body)
  if (!record) {
    res.status(404).json({ success: false, error: '记录未找到' })
    return
  }
  res.json({ success: true, record })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const success = deleteRecord(id)
  if (!success) {
    res.status(404).json({ success: false, error: '记录未找到' })
    return
  }
  res.json({ success: true })
})

export default router
