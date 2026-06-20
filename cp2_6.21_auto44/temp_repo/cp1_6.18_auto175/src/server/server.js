import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..', '..')

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

const uploadsDir = path.join(projectRoot, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${unique}-${file.originalname}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(wav|mp3|ogg|flac)$/i.test(file.originalname)
    if (ok) cb(null, true)
    else cb(new Error('仅支持 WAV / MP3 / OGG / FLAC 音频文件'))
  }
})

app.use('/uploads', express.static(uploadsDir))

app.post('/api/load-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '未上传文件' })
  }
  const url = `http://localhost:4000/uploads/${req.file.filename}`
  res.json({
    success: true,
    url,
    originalName: req.file.originalname,
    size: req.file.size
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() })
})

app.listen(PORT, () => {
  console.log(`AudioCollage server running on http://localhost:${PORT}`)
  console.log(`API: http://localhost:${PORT}/api/load-audio`)
})
