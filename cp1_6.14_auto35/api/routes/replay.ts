import { Router, type Request, type Response } from 'express'
import { getAllReplays, getBattleLog } from '../services/replayService.js'

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
    const log = await getBattleLog(req.params.id)
    if (!log) {
      res.status(404).json({ error: 'Battle log not found' })
      return
    }
    res.json(log)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch battle log' })
  }
})

export default router
