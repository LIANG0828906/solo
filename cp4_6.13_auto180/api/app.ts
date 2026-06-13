import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import recordsRoutes from './routes/records.js'
import leavesRoutes from './routes/leaves.js'
import summaryRoutes from './routes/summary.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/records', recordsRoutes)
app.use('/api/leaves', leavesRoutes)
app.use('/api/summary', summaryRoutes)

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
