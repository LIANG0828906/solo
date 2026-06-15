// 调用关系：被 server.ts, index.ts 引用
// 配置 Express 应用：中间件、路由、错误处理、session、日志

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import session from 'express-session'
import pointsRoutes from './routes/points.js'
import productsRoutes from './routes/products.js'
import exchangeRoutes from './routes/exchange.js'

dotenv.config()

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const validateJson = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON format in request body',
    })
    return
  }
  next(err)
}
app.use(validateJson)

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'eco-points-session-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
)

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()
  const originalSend = res.send.bind(res)

  res.send = ((body: unknown): Response => {
    const responseTime = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`)
    return originalSend(body)
  }) as typeof res.send

  next()
}
app.use(requestLogger)

app.use('/api/points', pointsRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/exchange', exchangeRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error(`[Error] ${error.name}: ${error.message}`)

  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: error.message || 'Validation error',
    })
    return
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: error.message || 'Resource not found',
    })
    return
  }

  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
export { ValidationError, NotFoundError }
