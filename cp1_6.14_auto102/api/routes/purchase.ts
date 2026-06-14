import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { songId, type } = req.body

    if (!songId || !type || !['digital', 'cd'].includes(type)) {
      res.status(400).json({ error: 'Invalid purchase data' })
      return
    }

    const db = await getDb()
    const song = db.data.songs.find(s => s.id === songId)

    if (!song) {
      res.status(404).json({ error: 'Song not found' })
      return
    }

    const purchase = {
      id: uuidv4(),
      songId,
      type,
      createdAt: new Date().toISOString()
    }

    db.data.purchases.push(purchase)
    song.purchaseCount += 1
    await db.write()

    const downloadUrl = type === 'digital' ? song.audioFile : undefined

    res.json({
      success: true,
      downloadUrl,
      message: type === 'digital' ? 'Purchase successful! You can now download the file.' : 'Order confirmed! Your CD will be shipped soon.'
    })
  } catch (error) {
    res.status(500).json({ error: 'Purchase failed' })
  }
})

export default router
