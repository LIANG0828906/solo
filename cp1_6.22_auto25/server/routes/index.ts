import { Router, type Request, type Response } from 'express'

const router = Router()

router.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok' })
})

export default router
