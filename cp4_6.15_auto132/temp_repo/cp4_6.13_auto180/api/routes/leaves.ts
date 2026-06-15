import { Router, type Request, type Response } from 'express'
import { getLeaves, createLeave, updateLeaveStatus } from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const status = req.query.status as string | undefined
  const leaves = getLeaves(status)
  res.json({ leaves })
})

router.post('/', (req: Request, res: Response): void => {
  const { startDate, endDate, type, reason } = req.body
  if (!startDate || !endDate || !type) {
    res.status(400).json({ success: false, error: '开始日期、结束日期和请假类型为必填项' })
    return
  }
  if (!['年假', '病假', '事假'].includes(type)) {
    res.status(400).json({ success: false, error: '无效的请假类型' })
    return
  }
  const leave = createLeave({ startDate, endDate, type, reason: reason || '' })
  res.json({ success: true, leave })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status } = req.body
  if (!['已通过', '已拒绝'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的状态' })
    return
  }
  const leave = updateLeaveStatus(id, status)
  if (!leave) {
    res.status(404).json({ success: false, error: '请假记录未找到' })
    return
  }
  res.json({ success: true, leave })
})

export default router
