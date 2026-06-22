import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import type { LevelData, LevelListItem } from '../shared/types.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const levels: LevelData[] = []

app.post('/api/levels', (req: Request, res: Response): void => {
  const { name, entities } = req.body
  const now = new Date().toISOString()
  const level: LevelData = {
    id: uuidv4(),
    name: name || 'Untitled Level',
    entities: entities || [],
    createdAt: now,
    updatedAt: now,
  }
  levels.push(level)
  res.status(201).json({ success: true, data: level })
})

app.get('/api/levels', (_req: Request, res: Response): void => {
  const list: LevelListItem[] = levels.map(({ id, name, createdAt, updatedAt }) => ({
    id,
    name,
    createdAt,
    updatedAt,
  }))
  res.status(200).json({ success: true, data: list })
})

app.get('/api/levels/:id', (req: Request, res: Response): void => {
  const level = levels.find((l) => l.id === req.params.id)
  if (!level) {
    res.status(404).json({ success: false, error: 'Level not found' })
    return
  }
  res.status(200).json({ success: true, data: level })
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
