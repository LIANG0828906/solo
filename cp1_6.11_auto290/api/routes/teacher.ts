import { Router, type Request, type Response } from 'express'
import {
  findTeacherByCredentials,
  getAllScores,
  getScoreById,
  updateScore,
  deleteScore,
  getLeaderboard,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from '../store.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { teacherId, password } = req.body
  if (!teacherId || !password) {
    res.status(400).json({ success: false, error: '教师编号和密码不能为空' })
    return
  }
  const teacher = findTeacherByCredentials(teacherId, password)
  if (!teacher) {
    res.status(401).json({ success: false, error: '教师编号或密码错误' })
    return
  }
  res.json({ success: true, data: { id: teacher.id, name: teacher.name, teacherId: teacher.teacherId } })
})

router.get('/scores', async (req: Request, res: Response): Promise<void> => {
  const { type, period } = req.query
  const scores = getAllScores(type as string | undefined, period as string | undefined)
  res.json({ success: true, data: scores })
})

router.put('/scores/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const existing = getScoreById(id)
  if (!existing) {
    res.status(404).json({ success: false, error: '成绩记录不存在' })
    return
  }
  const { score, detail } = req.body
  const updated = updateScore(id, { score, detail })
  res.json({ success: true, data: updated })
})

router.delete('/scores/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const success = deleteScore(id)
  if (!success) {
    res.status(404).json({ success: false, error: '成绩记录不存在' })
    return
  }
  res.json({ success: true })
})

router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  const { month } = req.query
  if (!month || typeof month !== 'string') {
    res.status(400).json({ success: false, error: 'month 参数必填' })
    return
  }
  const leaderboard = getLeaderboard(month)
  res.json({ success: true, data: leaderboard })
})

router.post('/training-plans', async (req: Request, res: Response): Promise<void> => {
  const { title, content, type, published } = req.body
  if (!title || !type) {
    res.status(400).json({ success: false, error: '标题和类型不能为空' })
    return
  }
  const plan = createPlan({ title, content, type, published: published ?? false })
  res.json({ success: true, data: plan })
})

router.put('/training-plans/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const existing = getPlanById(id)
  if (!existing) {
    res.status(404).json({ success: false, error: '训练计划不存在' })
    return
  }
  const { title, content, type, published } = req.body
  const updated = updatePlan(id, { title, content, type, published })
  res.json({ success: true, data: updated })
})

router.delete('/training-plans/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const success = deletePlan(id)
  if (!success) {
    res.status(404).json({ success: false, error: '训练计划不存在' })
    return
  }
  res.json({ success: true })
})

export default router
