import { Router, type Request, type Response } from 'express'
import {
  findStudentByNameAndId,
  addScore,
  getAllPublishedPlans,
  getRankingTrend,
} from '../store.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { name, studentId } = req.body
  if (!name || !studentId) {
    res.status(400).json({ success: false, error: '姓名和学号不能为空' })
    return
  }
  const student = findStudentByNameAndId(name, studentId)
  if (!student) {
    res.status(401).json({ success: false, error: '姓名或学号错误' })
    return
  }
  res.json({ success: true, data: student })
})

router.get('/training-plans', async (_req: Request, res: Response): Promise<void> => {
  const plans = getAllPublishedPlans()
  res.json({ success: true, data: plans })
})

router.get('/ranking-trend/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const trend = getRankingTrend(id)
  res.json({ success: true, data: trend })
})

router.post('/score', async (req: Request, res: Response): Promise<void> => {
  const { studentId, type, score, detail } = req.body
  if (!studentId || !type || score === undefined || !detail) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const record = addScore({ studentId, type, score, detail })
  res.json({ success: true, data: record })
})

export default router
