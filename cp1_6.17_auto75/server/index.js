import express from 'express'
import cors from 'cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbDir = join(__dirname)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbFile = join(dbDir, 'db.json')

const defaultData = {
  books: [],
}

const adapter = new JSONFile(dbFile)
const db = new Low(adapter, defaultData)

await db.read()

if (!db.data.books || db.data.books.length === 0) {
  const SPINE_COLORS = [
    '#C0392B', '#E74C3C', '#27AE60', '#2980B9',
    '#8E44AD', '#F39C12', '#16A085', '#34495E', '#E67E22',
  ]
  const MOCK_BORROWERS = [
    { name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan' },
    { name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi' },
    { name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu' },
  ]
  const bookData = [
    { title: '百年孤独', author: '加西亚·马尔克斯' },
    { title: '三体', author: '刘慈欣' },
    { title: '活着', author: '余华' },
    { title: '红楼梦', author: '曹雪芹' },
    { title: '平凡的世界', author: '路遥' },
    { title: '围城', author: '钱钟书' },
    { title: '白夜行', author: '东野圭吾' },
    { title: '追风筝的人', author: '卡勒德·胡赛尼' },
    { title: '小王子', author: '圣埃克苏佩里' },
    { title: '解忧杂货店', author: '东野圭吾' },
  ]

  db.data.books = bookData.map((data, index) => {
    const isBorrowed = Math.random() > 0.6
    const borrower = MOCK_BORROWERS[Math.floor(Math.random() * MOCK_BORROWERS.length)]
    const now = Date.now()
    const history = []
    for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
      const b = MOCK_BORROWERS[Math.floor(Math.random() * MOCK_BORROWERS.length)]
      history.push({
        id: uuidv4(),
        type: i % 2 === 0 ? 'borrow' : 'return',
        borrowerName: b.name,
        borrowerAvatar: b.avatar,
        timestamp: new Date(now - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
    if (isBorrowed) {
      history.unshift({
        id: uuidv4(),
        type: 'borrow',
        borrowerName: borrower.name,
        borrowerAvatar: borrower.avatar,
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
    return {
      id: uuidv4(),
      title: data.title,
      author: data.author,
      isbn: `978${Math.floor(Math.random() * 10000000000)}`,
      spineColor: SPINE_COLORS[Math.floor(Math.random() * SPINE_COLORS.length)],
      spineWidth: Math.floor(Math.random() * 21) + 20,
      position: index,
      status: isBorrowed ? 'borrowed' : 'available',
      currentBorrower: isBorrowed ? borrower : null,
      borrowHistory: history,
      createdAt: new Date(now - index * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
  await db.write()
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/books', (_req, res) => {
  res.json(db.data.books.sort((a, b) => a.position - b.position))
})

app.post('/api/books', async (req, res) => {
  const book = {
    id: uuidv4(),
    title: req.body.title || '未命名书籍',
    author: req.body.author || '未知作者',
    isbn: req.body.isbn,
    spineColor: req.body.spineColor || '#2980B9',
    spineWidth: req.body.spineWidth || 30,
    position: db.data.books.length,
    status: 'available',
    currentBorrower: null,
    borrowHistory: [],
    createdAt: new Date().toISOString(),
  }
  db.data.books.push(book)
  await db.write()
  res.status(201).json(book)
})

app.put('/api/books/:id', async (req, res) => {
  const index = db.data.books.findIndex((b) => b.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' })
  }
  db.data.books[index] = { ...db.data.books[index], ...req.body, id: req.params.id }
  await db.write()
  res.json(db.data.books[index])
})

app.put('/api/books/:id/reorder', async (req, res) => {
  const { position } = req.body
  const books = db.data.books
  const fromIndex = books.findIndex((b) => b.id === req.params.id)
  if (fromIndex === -1) {
    return res.status(404).json({ error: 'Book not found' })
  }
  const [removed] = books.splice(fromIndex, 1)
  books.splice(position, 0, removed)
  books.forEach((b, i) => (b.position = i))
  await db.write()
  res.json({ success: true })
})

app.put('/api/books/:id/borrow', async (req, res) => {
  const index = db.data.books.findIndex((b) => b.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' })
  }
  const borrower = req.body.borrower || { name: '访客', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest' }
  const book = db.data.books[index]
  const record = {
    id: uuidv4(),
    type: 'borrow',
    borrowerName: borrower.name,
    borrowerAvatar: borrower.avatar,
    timestamp: new Date().toISOString(),
  }
  book.status = 'borrowed'
  book.currentBorrower = borrower
  book.borrowHistory.unshift(record)
  await db.write()
  res.json(book)
})

app.put('/api/books/:id/return', async (req, res) => {
  const index = db.data.books.findIndex((b) => b.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' })
  }
  const book = db.data.books[index]
  const borrower = book.currentBorrower || { name: '访客', avatar: '' }
  const record = {
    id: uuidv4(),
    type: 'return',
    borrowerName: borrower.name,
    borrowerAvatar: borrower.avatar,
    timestamp: new Date().toISOString(),
  }
  book.status = 'available'
  book.currentBorrower = null
  book.borrowHistory.unshift(record)
  await db.write()
  res.json(book)
})

app.delete('/api/books/:id', async (req, res) => {
  const initialLen = db.data.books.length
  db.data.books = db.data.books.filter((b) => b.id !== req.params.id)
  if (db.data.books.length === initialLen) {
    return res.status(404).json({ error: 'Book not found' })
  }
  db.data.books.forEach((b, i) => (b.position = i))
  await db.write()
  res.json({ success: true })
})

app.get('/api/stats', (_req, res) => {
  const books = db.data.books
  const total = books.length
  const borrowed = books.filter((b) => b.status === 'borrowed').length
  const monthCount = {}
  books.forEach((book) => {
    book.borrowHistory.forEach((r) => {
      if (r.type === 'borrow') {
        const d = new Date(r.timestamp)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthCount[key] = (monthCount[key] || 0) + 1
      }
    })
  })
  const monthlyData = Object.entries(monthCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))
  res.json({ total, available: total - borrowed, borrowed, monthlyData })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Library API server running on http://localhost:${PORT}`)
})
