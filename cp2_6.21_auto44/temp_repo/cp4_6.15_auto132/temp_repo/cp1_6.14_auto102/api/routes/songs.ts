import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb()
    res.json({ songs: db.data.songs })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch songs' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb()
    const song = db.data.songs.find(s => s.id === req.params.id)
    if (!song) {
      res.status(404).json({ error: 'Song not found' })
      return
    }
    res.json({ song })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch song' })
  }
})

export default router
