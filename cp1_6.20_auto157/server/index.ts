import express from 'express'
import cors from 'cors'
import multer from 'multer'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { parseAudioFile } from './audioParser'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
})

app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: '没有上传音频文件' })
      return
    }

    const waveform = await parseAudioFile(req.file.path)

    fs.unlink(req.file.path, () => {})

    res.json({
      success: true,
      filename: req.file.originalname,
      duration: waveform.duration,
      sampleRate: waveform.sampleRate,
      samples: waveform.samples,
    })
  } catch (error) {
    console.error('解析音频失败:', error)
    res.status(500).json({ success: false, error: '解析音频文件失败' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`音频解析服务运行在 http://localhost:${PORT}`)
})
