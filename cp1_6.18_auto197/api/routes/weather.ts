import { Router, type Request, type Response } from 'express'
import { getSimulatedWeather } from '../weatherService.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  res.json(getSimulatedWeather())
})

export default router
