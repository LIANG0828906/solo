import express from 'express'
import cors from 'cors'
import session from 'express-session'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { db } from './db'
import booksRouter from './routes/books'
import chatRouter from './routes/chat'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const dataDir = path.join(__dirname, '..', '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(
  session({
    secret: 'book-drifting-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
)

app.use('/uploads', express.static(uploadDir))

app.post('/api/auth/register', async (req, res) => {
  await db.read()
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }

  const exists = db.data.users.find(u => u.username === username)
  if (exists) {
    return res.status(400).json({ error: '用户名已存在' })
  }

  const user = {
    id: uuidv4(),
    username,
    password,
  }

  db.data.users.push(user)
  await db.write()

  req.session.userId = user.id

  res.status(201).json({ id: user.id, username: user.username })
})

app.post('/api/auth/login', async (req, res) => {
  await db.read()
  const { username, password } = req.body

  const user = db.data.users.find(u => u.username === username && u.password === password)
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  req.session.userId = user.id

  res.json({ id: user.id, username: user.username })
})

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true })
  })
})

app.get('/api/auth/me', async (req, res) => {
  await db.read()
  const userId = req.session.userId

  if (!userId) {
    return res.json(null)
  }

  const user = db.data.users.find(u => u.id === userId)
  if (!user) {
    return res.json(null)
  }

  res.json({ id: user.id, username: user.username })
})

app.post('/api/upload', async (req, res) => {
  const sessionUserId = req.session.userId
  if (!sessionUserId) {
    return res.status(401).json({ error: '请先登录' })
  }

  const { image } = req.body

  if (!image || !image.startsWith('data:image')) {
    return res.status(400).json({ error: '无效的图片数据' })
  }

  try {
    const base64Data = image.split(',')[1]
    const filename = `${uuidv4()}.jpg`
    const filepath = path.join(uploadDir, filename)

    fs.writeFileSync(filepath, base64Data, 'base64')

    const url = `/uploads/${filename}`
    res.json({ url })
  } catch (error) {
    console.error('上传失败:', error)
    res.status(500).json({ error: '上传失败' })
  }
})

app.get('/api/drop-points', async (req, res) => {
  await db.read()

  const points = db.data.dropPoints.map(dp => {
    const hasBooks = db.data.books.some(b => b.dropPointId === dp.id && b.status === 'available')
    return { ...dp, hasAvailableBooks: hasBooks }
  })

  res.json({ points })
})

app.get('/api/users/:id', async (req, res) => {
  await db.read()
  const { id } = req.params

  const user = db.data.users.find(u => u.id === id)
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }

  res.json({ id: user.id, username: user.username })
})

app.use('/api/books', booksRouter)
app.use('/api/chat', chatRouter)

app.listen(PORT, () => {
  console.log(`\n📚 书漂流平台后端服务已启动`)
  console.log(`🚀 服务地址: http://localhost:${PORT}`)
  console.log(`📖 测试账号: 书虫小明 / 123456`)
  console.log(`📖 测试账号: 爱读书的猫 / 123456\n`)
})
