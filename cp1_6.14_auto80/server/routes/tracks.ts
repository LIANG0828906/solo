import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getDb, type DbTrack, type TrackEffects, type BandMember } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp3', '.wav']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持MP3和WAV格式'))
    }
  },
})

const router = Router()
router.use(authMiddleware)

const defaultEffects: TrackEffects = {
  reverb: { enabled: false, wet: 0 },
  delay: { enabled: false, wet: 0 },
}

router.get('/band/:bandId', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const tracks = db.data.tracks
      .filter((t: DbTrack) => t.bandId === req.params.bandId)
      .sort((a: DbTrack, b: DbTrack) => a.order - b.order)
    res.json({ success: true, data: tracks })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取音轨列表失败' })
  }
})

router.post(
  '/band/:bandId',
  upload.single('audio'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId
      const { bandId } = req.params
      const { name } = req.body
      const file = req.file
      if (!file) {
        res.status(400).json({ success: false, error: '请上传音频文件' })
        return
      }
      if (!name) {
        res.status(400).json({ success: false, error: '音轨名称不能为空' })
        return
      }
      const db = await getDb()
      const band = db.data.bands.find((b) => b.id === bandId)
      if (!band) {
        res.status(404).json({ success: false, error: '乐队不存在' })
        return
      }
      if (!band.members.some((m: BandMember) => m.userId === userId)) {
        res.status(403).json({ success: false, error: '你不是该乐队成员' })
        return
      }
      const existingTracks = db.data.tracks.filter((t: DbTrack) => t.bandId === bandId)
      const track: DbTrack = {
        id: uuidv4(),
        bandId,
        name,
        fileName: file.filename,
        duration: 0,
        volume: 80,
        pan: 0,
        muted: false,
        order: existingTracks.length,
        effects: { ...defaultEffects },
        createdAt: new Date().toISOString(),
      }
      db.data.tracks.push(track)
      await db.write()
      res.status(201).json({
        success: true,
        data: { ...track, url: `/api/tracks/file/${file.filename}` },
      })
    } catch (error) {
      res.status(500).json({ success: false, error: '上传音轨失败' })
    }
  }
)

router.get('/file/:filename', (req: Request, res: Response): void => {
  const filePath = path.join(uploadsDir, req.params.filename)
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath)
  } else {
    res.status(404).json({ success: false, error: '文件不存在' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const trackIndex = db.data.tracks.findIndex((t: DbTrack) => t.id === req.params.id)
    if (trackIndex === -1) {
      res.status(404).json({ success: false, error: '音轨不存在' })
      return
    }
    const { volume, pan, muted, effects, order } = req.body
    const track = db.data.tracks[trackIndex]
    if (volume !== undefined) track.volume = Math.max(0, Math.min(100, volume))
    if (pan !== undefined) track.pan = Math.max(-100, Math.min(100, pan))
    if (muted !== undefined) track.muted = muted
    if (order !== undefined) track.order = order
    if (effects) {
      track.effects = {
        reverb: effects.reverb ? { ...track.effects.reverb, ...effects.reverb } : track.effects.reverb,
        delay: effects.delay ? { ...track.effects.delay, ...effects.delay } : track.effects.delay,
      }
    }
    await db.write()
    res.json({ success: true, data: track })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新音轨失败' })
  }
})

router.put('/band/:bandId/order', async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackOrders } = req.body as { trackOrders: { id: string; order: number }[] }
    const db = await getDb()
    for (const item of trackOrders) {
      const track = db.data.tracks.find((t: DbTrack) => t.id === item.id)
      if (track) {
        track.order = item.order
      }
    }
    await db.write()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新排序失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb()
    const trackIndex = db.data.tracks.findIndex((t: DbTrack) => t.id === req.params.id)
    if (trackIndex === -1) {
      res.status(404).json({ success: false, error: '音轨不存在' })
      return
    }
    const track = db.data.tracks[trackIndex]
    const filePath = path.join(uploadsDir, track.fileName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    db.data.tracks.splice(trackIndex, 1)
    await db.write()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除音轨失败' })
  }
})

export default router
