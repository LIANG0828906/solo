import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/ai/command', (_req, res) => {
  const types: ('surround' | 'disperse' | 'formation')[] = ['surround', 'disperse', 'formation']
  const type = types[Math.floor(Math.random() * types.length)]
  const target = {
    x: 200 + Math.random() * 400,
    y: 150 + Math.random() * 300,
  }
  const params: { radius?: number; width?: number; arc?: boolean } = {}
  if (type === 'surround' || type === 'disperse') {
    params.radius = 80 + Math.random() * 80
  }
  if (type === 'formation') {
    params.width = 150 + Math.random() * 200
    params.arc = Math.random() > 0.5
  }
  res.json({
    type,
    target,
    params,
    timestamp: Date.now(),
  })
})

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
