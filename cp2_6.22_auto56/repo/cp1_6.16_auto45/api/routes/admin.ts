import { Router, type Request, type Response } from 'express'
import { getPendingEvents, updateEventStatus } from '../services/eventService.js'

const router = Router()

router.get('/events', (req: Request, res: Response): void => {
  const { status } = req.query as Record<string, string>
  const events = getPendingEvents(status)
  res.json({ success: true, data: events })
})

router.put('/events/:id/verify', (req: Request, res: Response): void => {
  const { action, reason } = req.body
  if (!action || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ success: false, error: 'action 必须为 approve 或 reject' })
    return
  }
  const event = updateEventStatus(req.params.id, action, reason)
  if (!event) {
    res.status(404).json({ success: false, error: '活动不存在' })
    return
  }
  res.json({ success: true, data: event })
})

export default router
