import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ extended: true, limit: '500mb' }))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'))
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only mp4 and webm files are allowed'))
    }
  },
})

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' })
    return
  }
  res.status(200).json({
    success: true,
    data: {
      id: req.body.fileId || Date.now().toString(),
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    },
  })
})

app.get('/api/audio/:style', (req: Request, res: Response) => {
  const validStyles = ['light', 'soothing', 'suspense', 'intense', 'romantic']
  const style = req.params.style
  if (!validStyles.includes(style)) {
    res.status(400).json({ success: false, error: 'Invalid audio style' })
    return
  }
  res.status(200).json({
    success: true,
    data: {
      style,
      url: `/audio/${style}.mp3`,
      duration: 30,
    },
  })
})

app.use('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
