import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB, getDB } from './db.js'
import itemRoutes from './routes/items.js'
import exchangeRoutes from './routes/exchange.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/items', itemRoutes)
app.use('/api/exchange', exchangeRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

app.use((err, req, res, _next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: '服务器内部错误', detail: err.message })
})

async function autoExpireTask() {
  try {
    const db = getDB()
    const now = Date.now()
    let changed = false
    for (const ex of db.data.exchanges) {
      if (
        ex.status === 'accepted' &&
        ex.acceptedAt &&
        now - ex.acceptedAt > 86400000
      ) {
        ex.status = 'expired'
        changed = true
      }
    }
    if (changed) {
      await db.write()
      console.log('[auto-expire] 已自动过期超时的交换请求')
    }
  } catch (err) {
    console.error('[auto-expire] error:', err.message)
  }
}

setInterval(autoExpireTask, 60 * 1000)

initDB().then(() => {
  console.log('数据库初始化完成')
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('数据库初始化失败:', err)
  process.exit(1)
})
