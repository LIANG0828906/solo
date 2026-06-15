import express, { Request, Response } from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { queryByEmotions, Song, EmotionTag, EMOTION_LABELS } from './musicDB'
import { detectFromEmoji, analyzeBrightness, mockImageAnalysis, PixelSample } from './emotionEngine'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads')

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${Date.now()}-${uuidv4()}${ext}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } })

type Favorite = { id: string; song: Song; addedAt: number }
type HistoryItem = { id: string; song: Song; playedAt: number; emotion?: EmotionTag }

const store = {
  favorites: new Map<string, Favorite>(),
  history: new Map<string, HistoryItem>(),
  lastRecommend: [] as Song[]
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now() })
})

app.post('/api/emotion/emoji', (req: Request, res: Response) => {
  const t0 = Date.now()
  const { emoji } = req.body || {}
  if (!emoji || typeof emoji !== 'string') {
    return res.status(400).json({ error: '缺少 emoji 参数' })
  }
  const result = detectFromEmoji(emoji)
  const songs = queryByEmotions(result.tags, 8)
  store.lastRecommend = songs
  res.json({
    latencyMs: Date.now() - t0,
    emotion: {
      ...result,
      label: EMOTION_LABELS[result.primary]
    },
    songs
  })
})

app.post('/api/emotion/image', upload.single('image'), async (req: Request, res: Response) => {
  const t0 = Date.now()
  try {
    const file = req.file
    const samples: PixelSample[] | undefined = req.body.samples
      ? safeParseJSON(req.body.samples)
      : undefined

    let analysis
    if (samples && Array.isArray(samples) && samples.length > 0) {
      analysis = analyzeBrightness(samples)
    } else if (file) {
      analysis = mockImageAnalysis(file.path)
    } else {
      analysis = mockImageAnalysis()
    }

    const songs = queryByEmotions(analysis.tags, 8)
    store.lastRecommend = songs

    if (file) {
      setTimeout(() => {
        fs.promises.unlink(file.path).catch(() => {})
      }, 60_000)
    }

    res.json({
      latencyMs: Date.now() - t0,
      emotion: {
        ...analysis,
        label: EMOTION_LABELS[analysis.primary]
      },
      songs
    })
  } catch (err) {
    console.error('[emotion/image]', err)
    res.status(500).json({ error: '分析失败' })
  }
})

app.get('/api/moods', (_req: Request, res: Response) => {
  res.json({
    moods: Object.entries(EMOTION_LABELS).map(([key, val]) => ({
      key,
      ...val
    }))
  })
})

app.get('/api/favorites', (_req: Request, res: Response) => {
  const list = Array.from(store.favorites.values()).sort((a, b) => b.addedAt - a.addedAt)
  res.json({ items: list })
})

app.post('/api/favorites', (req: Request, res: Response) => {
  const song = req.body?.song as Song | undefined
  if (!song || !song.id) return res.status(400).json({ error: '缺少 song' })
  if (store.favorites.has(song.id)) {
    return res.json({ added: false, existed: true, item: store.favorites.get(song.id) })
  }
  const item: Favorite = { id: song.id, song, addedAt: Date.now() }
  store.favorites.set(song.id, item)
  res.json({ added: true, existed: false, item })
})

app.delete('/api/favorites/:id', (req: Request, res: Response) => {
  const id = req.params.id
  const existed = store.favorites.has(id)
  store.favorites.delete(id)
  res.json({ removed: existed })
})

app.post('/api/history', (req: Request, res: Response) => {
  const song = req.body?.song as Song | undefined
  const emotion = req.body?.emotion as EmotionTag | undefined
  if (!song || !song.id) return res.status(400).json({ error: '缺少 song' })
  const item: HistoryItem = { id: song.id + '-' + Date.now(), song, playedAt: Date.now(), emotion }
  store.history.set(item.id, item)
  res.json({ item })
})

app.get('/api/history', (_req: Request, res: Response) => {
  const list = Array.from(store.history.values()).sort((a, b) => b.playedAt - a.playedAt).slice(0, 50)
  res.json({ items: list })
})

function safeParseJSON(s: any) {
  try { return JSON.parse(typeof s === 'string' ? s : '{}') } catch { return undefined }
}

app.listen(PORT, () => {
  console.log(`[server] emotion-music API running on http://localhost:${PORT}`)
})
