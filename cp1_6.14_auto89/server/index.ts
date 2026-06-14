// ============================================================
// Express 服务器入口
// 数据流向：客户端请求 → 中间件 → 路由 → 数据库 → 响应
// 调用关系：nodemon 启动此文件，注册所有路由和中间件
// ============================================================

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDb } from './db.js'
import authRoutes from './routes/auth.js'
import clothesRoutes from './routes/clothes.js'
import outfitsRoutes from './routes/outfits.js'
import usersRoutes from './routes/users.js'
import swapsRoutes from './routes/swaps.js'

// ESM 模式下获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载环境变量
dotenv.config()

const app: express.Application = express()

// 中间件配置
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务：server/uploads 目录映射到 /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

/**
 * API 路由注册
 */
app.use('/api/auth', authRoutes)
app.use('/api/clothes', clothesRoutes)
app.use('/api/outfits', outfitsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/swaps', swapsRoutes)

/**
 * 健康检查接口
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * 错误处理中间件
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 处理
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

// 端口配置
const PORT = process.env.PORT || 3001

/**
 * 启动服务器
 * 先初始化数据库，再监听端口
 */
async function startServer(): Promise<void> {
  try {
    // 初始化数据库（读取 db.json，如果不存在则生成 mock 数据）
    await initDb()
    console.log('Database initialized successfully')

    // 启动服务器
    const server = app.listen(PORT, () => {
      console.log(`Server ready on port ${PORT}`)
      console.log(`API base URL: http://localhost:${PORT}/api`)
      console.log(`Uploads URL: http://localhost:${PORT}/uploads`)
    })

    /**
     * 优雅关闭服务器
     */
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      console.log('SIGINT signal received')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer()

export default app
