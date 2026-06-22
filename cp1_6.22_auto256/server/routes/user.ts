import { Router } from 'express'
import type { Request, Response } from 'express'
import { memoryStore } from '../store/memory'
import type { FitnessLevel, SportType } from '@/types'

const router = Router()

router.get('/current', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined
  const user = memoryStore.getOrCreateUser(userId)
  res.json({ user })
})

router.put('/preferences', (req: Request, res: Response) => {
  const { userId, fitnessLevel, preferences, locationRadius } = req.body as {
    userId: string
    fitnessLevel: FitnessLevel
    preferences: SportType[]
    locationRadius: number
  }

  const user = memoryStore.updateUserPreferences(userId, fitnessLevel, preferences, locationRadius)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ user })
})

router.get('/history', (req: Request, res: Response) => {
  const userId = req.query.userId as string
  const history = memoryStore.getUserHistory(userId)
  res.json({ history })
})

export default router
