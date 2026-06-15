/**
 * 【文件职责】Express 应用配置模块
 * 配置中间件（JSON解析、CORS、Session）、路由挂载、404和错误处理
 * 【被调用方】api/server.ts (本地开发)、api/index.ts (Vercel部署)
 * 【数据流向】HTTP 请求 → express 中间件链 → Router 分发 → 对应路由 handler → 响应返回
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import session from 'express-session'

import authRouter from './routes/auth.js'
import matchesRouter from './routes/matches.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors({
  origin: true,
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(session({
  secret: process.env.SESSION_SECRET || 'courtcall-dev-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}))

app.use('/api/auth', authRouter)
app.use('/api', matchesRouter)

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

export default app
