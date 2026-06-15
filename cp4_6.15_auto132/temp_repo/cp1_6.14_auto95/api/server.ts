import app from './app.js'
import { initDb } from './db/index.js'
import { startCronJobs } from './services/overdue.js'

const PORT = process.env.PORT || 3001

async function start() {
  await initDb()
  console.log('数据库初始化完成')

  startCronJobs()

  const server = app.listen(PORT, () => {
    console.log(`服务已启动：http://localhost:${PORT}`)
  })

  process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号')
    server.close(() => {
      console.log('服务已关闭')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('收到SIGINT信号')
    server.close(() => {
      console.log('服务已关闭')
      process.exit(0)
    })
  })
}

start()
