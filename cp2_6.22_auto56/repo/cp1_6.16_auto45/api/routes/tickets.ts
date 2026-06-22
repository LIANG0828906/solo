import { Router, type Request, type Response } from 'express'
import { createTickets, getTicketsByUser, checkinTicket as checkin } from '../services/ticketService.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { eventId, tier, quantity, userId } = req.body
  if (!eventId || !tier || !quantity || !userId) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }
  try {
    const tickets = createTickets(eventId, tier, quantity, userId)
    res.status(201).json({ success: true, data: tickets })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '创建票券失败'
    res.status(400).json({ success: false, error: message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  const { userId } = req.query as Record<string, string>
  if (!userId) {
    res.status(400).json({ success: false, error: '缺少 userId' })
    return
  }
  const tickets = getTicketsByUser(userId)
  res.json({ success: true, data: tickets })
})

router.put('/checkin', (req: Request, res: Response): void => {
  const { ticketNo } = req.body
  if (!ticketNo) {
    res.status(400).json({ success: false, error: '缺少 ticketNo' })
    return
  }
  try {
    const ticket = checkin(ticketNo)
    res.json({ success: true, data: ticket })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '核销失败'
    res.status(400).json({ success: false, error: message })
  }
})

export default router
