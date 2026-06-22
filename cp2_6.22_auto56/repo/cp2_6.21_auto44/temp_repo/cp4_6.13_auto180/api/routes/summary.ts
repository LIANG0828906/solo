import { Router, type Request, type Response } from 'express'
import { getSummary } from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const period = (req.query.period as string) === 'month' ? 'month' : 'week'
  const summary = getSummary(period)
  res.json(summary)
})

export default router
