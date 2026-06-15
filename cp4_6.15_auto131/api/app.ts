import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import {
  getLeaderboard,
  submitRecord,
  getUserProfile,
  sendFriendRequest,
} from './challengeManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)

app.post('/api/records', (req: Request, res: Response): void => {
  const { userId, activities } = req.body
  if (!userId || !activities) {
    res.status(400).json({ success: false, error: 'Missing userId or activities' })
    return
  }
  const result = submitRecord(userId, activities)
  res.status(200).json({ success: true, record: result.record, advice: result.advice })
})

app.get('/api/records/:userId', (req: Request, res: Response): void => {
  res.status(200).json({ success: true })
})

app.get('/api/leaderboard', (_req: Request, res: Response): void => {
  const leaderboard = getLeaderboard()
  res.status(200).json({ success: true, data: leaderboard })
})

app.post('/api/friends/request', (req: Request, res: Response): void => {
  const { from, to } = req.body
  if (!from || !to) {
    res.status(400).json({ success: false, error: 'Missing from or to' })
    return
  }
  const result = sendFriendRequest(from, to)
  res.status(200).json({ success: result })
})

app.get('/api/users/:userId', (req: Request, res: Response): void => {
  const profile = getUserProfile(req.params.userId)
  if (!profile) {
    res.status(404).json({ success: false, error: 'User not found' })
    return
  }
  res.status(200).json({ success: true, data: profile })
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
