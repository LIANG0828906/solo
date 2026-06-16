import { Router, type Request, type Response } from 'express'
import { getAnalytics } from '../services/ticketService.js'

const router = Router()

router.get('/:eventId', (req: Request, res: Response): void => {
  try {
    const data = getAnalytics(req.params.eventId)
    res.json({ success: true, data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '获取分析数据失败'
    res.status(404).json({ success: false, error: message })
  }
})

export default router
