import { Router } from 'express'
import type { Request, Response } from 'express'
import { planGenerator } from '@/PlanGenerator'
import { generateWeatherData } from '@/utils/weather'
import { memoryStore } from '../store/memory'

const router = Router()

router.get('/recommendations', (req: Request, res: Response) => {
  const userId = req.query.userId as string
  const user = memoryStore.getOrCreateUser(userId)
  const weather = generateWeatherData()
  const plans = planGenerator.generate(user, weather)
  res.json({ plans, weather })
})

router.get('/sports', (_req: Request, res: Response) => {
  const sports = planGenerator.getAllSports()
  res.json({ sports })
})

export default router
