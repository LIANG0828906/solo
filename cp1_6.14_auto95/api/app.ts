import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import booksRoutes from './routes/books.js'
import loansRoutes from './routes/loans.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/loans', loansRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: '服务器内部错误' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API不存在' })
})

export default app
