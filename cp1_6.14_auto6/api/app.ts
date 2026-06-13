import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const DATA_DIR = path.join(__dirname, '..', 'data')
const FLAGS_FILE = path.join(DATA_DIR, 'flags.json')

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(FLAGS_FILE)) {
    fs.writeFileSync(FLAGS_FILE, JSON.stringify({ flags: [] }, null, 2))
  }
}

function readFlags(): Array<Record<string, unknown>> {
  ensureDataFile()
  const raw = fs.readFileSync(FLAGS_FILE, 'utf-8')
  const data = JSON.parse(raw)
  return data.flags || []
}

function writeFlags(flags: Array<Record<string, unknown>>): void {
  ensureDataFile()
  fs.writeFileSync(FLAGS_FILE, JSON.stringify({ flags }, null, 2))
}

app.get('/api/flags', (_req: Request, res: Response): void => {
  try {
    const flags = readFlags()
    res.status(200).json(flags)
  } catch {
    res.status(500).json({ success: false, error: 'Failed to read flags' })
  }
})

app.post('/api/flags', (req: Request, res: Response): void => {
  try {
    const { x, y, z, color } = req.body
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number' || typeof color !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid flag data' })
      return
    }
    const flags = readFlags()
    const newFlag = {
      id: uuidv4(),
      x,
      y,
      z,
      color,
      timestamp: Date.now(),
    }
    flags.push(newFlag)
    writeFlags(flags)
    res.status(201).json({ success: true, id: newFlag.id, timestamp: newFlag.timestamp })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to save flag' })
  }
})

app.delete('/api/flags', (_req: Request, res: Response): void => {
  try {
    const flags = readFlags()
    const cleared = flags.length
    writeFlags([])
    res.status(200).json({ success: true, cleared })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to clear flags' })
  }
})

app.use(
  '/api/health',
  (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
