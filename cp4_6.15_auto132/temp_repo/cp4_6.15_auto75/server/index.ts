import type { VercelRequest, VercelResponse } from '@vercel/node'
import app from './app.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res)
}

const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`🚀 失物招领后端服务已启动`)
  console.log(`📍 服务地址: http://localhost:${PORT}`)
  console.log(`📋 API 基础路径: /api`)
  console.log(`📦 物品接口: GET/POST /api/items`)
  console.log(`🔍 匹配接口: POST /api/matches`)
})

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
