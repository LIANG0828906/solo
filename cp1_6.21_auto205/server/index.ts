import express from 'express'
import cors from 'cors'
import snippetRoutes from './routes/snippetRoutes'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

app.use('/api/snippets', snippetRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '代码沙盒 API 服务运行正常' })
})

app.listen(PORT, () => {
  console.log(`\n🚀 后端 API 服务器已启动`)
  console.log(`📍 服务地址: http://localhost:${PORT}`)
  console.log(`📁 API 路径: http://localhost:${PORT}/api/snippets`)
  console.log(`💚 健康检查: http://localhost:${PORT}/api/health\n`)
})
