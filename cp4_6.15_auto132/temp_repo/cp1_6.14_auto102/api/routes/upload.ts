import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'
import type { Song } from '../db.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const ext = path.extname(_file.originalname).toLowerCase()
    if (ext === '.mp3' || ext === '.wav') {
      cb(null, 'uploads/audio/')
    } else if (ext === '.pdf') {
      cb(null, 'uploads/scores/')
    } else {
      cb(null, 'uploads/covers/')
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (file.fieldname === 'audio' && ext !== '.mp3') {
      cb(new Error('Audio must be MP3 format'))
      return
    }
    if (file.fieldname === 'score' && ext !== '.pdf') {
      cb(new Error('Score must be PDF format'))
      return
    }
    cb(null, true)
  }
})

const router = Router()

router.post('/', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'score', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const { title, artist, tags, priceDigital, priceCD, description, lyrics } = req.body

    if (!title || !artist || !priceDigital || !priceCD) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const audioFile = files.audio?.[0] ? `/uploads/audio/${files.audio[0].filename}` : ''
    const scoreFile = files.score?.[0] ? `/uploads/scores/${files.score[0].filename}` : ''
    const coverImage = files.cover?.[0] ? `/uploads/covers/${files.cover[0].filename}` : ''

    const db = await getDb()
    const newSong: Song = {
      id: uuidv4(),
      title,
      artist,
      artistAvatar: '',
      tags: tags ? JSON.parse(tags) : [],
      priceDigital: parseFloat(priceDigital),
      priceCD: parseFloat(priceCD),
      coverImage,
      audioFile,
      scoreFile,
      lyrics: lyrics || '',
      description: description || '',
      purchaseCount: 0,
      rating: 0,
      createdAt: new Date().toISOString()
    }

    db.data.songs.push(newSong)
    await db.write()

    res.json({ success: true, song: newSong })
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' })
  }
})

export default router
