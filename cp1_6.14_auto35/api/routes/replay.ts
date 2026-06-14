import { Router, type Request, type Response } from 'express'
import { getAllReplays, getReplayById, ReplayNotFoundError, BattleLogReadError } from '../services/replayService.js'

const router = Router()

router.get('/replays', async (_req: Request, res: Response): Promise<void> => {
  try {
    const replays = await getAllReplays()
    res.json(replays)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch replays' })
  }
})

router.get('/replay/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const log = await getReplayById(req.params.id)
    res.json(log)
  } catch (error) {
    if (error instanceof ReplayNotFoundError) {
      res.status(404).json({ error: error.message })
      return
    }
    if (error instanceof BattleLogReadError) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to fetch battle log' })
  }
})

export default router
