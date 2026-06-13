import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log(`[Server] Created uploads directory: ${uploadsDir}`)
}
app.use('/uploads', express.static(uploadsDir))

const dbPath = path.join(__dirname, '../data.json')
const adapter = new FileSync(dbPath)
const db = lowdb(adapter)

const VALID_CONDITIONS = ['全新', '九成新', '七成新', '五成新', '三成新'] as const
const VALID_CATEGORIES = ['家具', '电器', '书籍', '服饰', '玩具', '厨房用品', '装饰品', '其他'] as const

type ConditionType = typeof VALID_CONDITIONS[number]
type CategoryType = typeof VALID_CATEGORIES[number]

type User = {
  id: string
  username: string
  password: string
  nickname: string
  avatar?: string
  createdAt: string
}

type Item = {
  id: string
  userId: string
  name: string
  category: CategoryType
  condition: ConditionType
  city: string
  photos: string[]
  story: string
  likes: number
  createdAt: string
  status: 'available' | 'exchanged'
}

type Exchange = {
  id: string
  fromUserId: string
  toUserId: string
  fromItemId: string
  toItemId: string
  status: 'pending' | 'exchanging' | 'completed' | 'rejected'
  createdAt: string
  updatedAt: string
}

type Favorite = {
  id: string
  userId: string
  itemId: string
  createdAt: string
}

type DatabaseSchema = {
  users: User[]
  items: Item[]
  exchanges: Exchange[]
  favorites: Favorite[]
}

db.defaults<DatabaseSchema>({
  users: [],
  items: [],
  exchanges: [],
  favorites: []
}).write()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const upload = multer({ storage })

function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...rest } = user
  return rest
}

function validateCondition(condition: string): condition is ConditionType {
  return VALID_CONDITIONS.includes(condition as ConditionType)
}

function validateCategory(category: string): category is CategoryType {
  return VALID_CATEGORIES.includes(category as CategoryType)
}

app.post('/api/auth/register', (req, res) => {
  const { username, password, nickname } = req.body
  if (!username || !password || !nickname) {
    return res.status(400).json({ message: '请填写完整信息' })
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ message: '用户名长度需在3-20个字符之间' })
  }
  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度不能少于6位' })
  }
  const existing = db.get('users').find({ username }).value() as User | undefined
  if (existing) {
    return res.status(400).json({ message: '用户名已存在' })
  }
  const user: User = {
    id: uuidv4(),
    username,
    password,
    nickname,
    createdAt: new Date().toISOString()
  }
  db.get('users').push(user).write()
  res.json({ user: sanitizeUser(user), token: user.id })
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: '请填写用户名和密码' })
  }
  const user = db.get('users').find({ username, password }).value() as User | undefined
  if (!user) {
    return res.status(400).json({ message: '用户名或密码错误' })
  }
  res.json({ user: sanitizeUser(user), token: user.id })
})

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const user = db.get('users').find({ id: token }).value() as User | undefined
  if (!user) {
    return res.status(401).json({ message: '用户不存在' })
  }
  res.json({ user: sanitizeUser(user) })
})

app.get('/api/config', (_req, res) => {
  res.json({
    conditions: VALID_CONDITIONS,
    categories: VALID_CATEGORIES
  })
})

app.post('/api/items', upload.array('photos', 3), (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const user = db.get('users').find({ id: token }).value() as User | undefined
  if (!user) {
    return res.status(401).json({ message: '用户不存在' })
  }
  const { name, category, condition, city, story } = req.body
  if (!name || !category || !condition || !city || !story) {
    return res.status(400).json({ message: '请填写完整信息' })
  }
  if (!validateCategory(category)) {
    return res.status(400).json({ message: `物品类别无效，可选值：${VALID_CATEGORIES.join('、')}` })
  }
  if (!validateCondition(condition)) {
    return res.status(400).json({ message: `新旧程度无效，可选值：${VALID_CONDITIONS.join('、')}` })
  }
  if (story.length < 50 || story.length > 500) {
    return res.status(400).json({ message: '故事长度需在50-500字之间' })
  }
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ message: '物品名称长度需在2-50个字符之间' })
  }
  if (city.length < 2 || city.length > 30) {
    return res.status(400).json({ message: '城市名称长度需在2-30个字符之间' })
  }
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    return res.status(400).json({ message: '请至少上传一张照片' })
  }
  if (files.length > 3) {
    return res.status(400).json({ message: '最多只能上传3张照片' })
  }
  const photos = files.map(f => `/uploads/${f.filename}`)
  const item: Item = {
    id: uuidv4(),
    userId: user.id,
    name,
    category: category as CategoryType,
    condition: condition as ConditionType,
    city,
    photos,
    story,
    likes: 0,
    createdAt: new Date().toISOString(),
    status: 'available'
  }
  db.get('items').push(item).write()
  res.json({ item })
})

app.put('/api/items/:id', upload.array('photos', 3), (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const item = db.get('items').find({ id: req.params.id }).value() as Item | undefined
  if (!item) {
    return res.status(404).json({ message: '物品不存在' })
  }
  if (item.userId !== token) {
    return res.status(403).json({ message: '无权限修改' })
  }
  const { name, category, condition, city, story, existingPhotos } = req.body
  if (!name || !category || !condition || !city || !story) {
    return res.status(400).json({ message: '请填写完整信息' })
  }
  if (!validateCategory(category)) {
    return res.status(400).json({ message: `物品类别无效，可选值：${VALID_CATEGORIES.join('、')}` })
  }
  if (!validateCondition(condition)) {
    return res.status(400).json({ message: `新旧程度无效，可选值：${VALID_CONDITIONS.join('、')}` })
  }
  if (story.length < 50 || story.length > 500) {
    return res.status(400).json({ message: '故事长度需在50-500字之间' })
  }
  let photos: string[] = []
  if (existingPhotos) {
    photos = Array.isArray(existingPhotos) ? existingPhotos : [existingPhotos]
  }
  const files = req.files as Express.Multer.File[] | undefined
  if (files && files.length > 0) {
    photos = [...photos, ...files.map(f => `/uploads/${f.filename}`)]
  }
  if (photos.length === 0) {
    return res.status(400).json({ message: '请至少保留一张照片' })
  }
  if (photos.length > 3) {
    return res.status(400).json({ message: '最多只能保留3张照片' })
  }
  db.get('items').find({ id: req.params.id }).assign({
    name,
    category: category as CategoryType,
    condition: condition as ConditionType,
    city,
    story,
    photos
  }).write()
  const updated = db.get('items').find({ id: req.params.id }).value() as Item
  res.json({ item: updated })
})

app.delete('/api/items/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const item = db.get('items').find({ id: req.params.id }).value() as Item | undefined
  if (!item) {
    return res.status(404).json({ message: '物品不存在' })
  }
  if (item.userId !== token) {
    return res.status(403).json({ message: '无权限删除' })
  }
  db.get('items').remove({ id: req.params.id }).write()
  db.get('favorites').remove({ itemId: req.params.id }).write()
  res.json({ success: true })
})

app.get('/api/items', (_req, res) => {
  const items = db.get('items').sortBy('createdAt').reverse().value() as Item[]
  const result = items.map(item => {
    const user = db.get('users').find({ id: item.userId }).value() as User | undefined
    return {
      ...item,
      author: user ? sanitizeUser(user) : null
    }
  })
  res.json({ items: result })
})

app.get('/api/items/:id', (req, res) => {
  const item = db.get('items').find({ id: req.params.id }).value() as Item | undefined
  if (!item) {
    return res.status(404).json({ message: '物品不存在' })
  }
  const user = db.get('users').find({ id: item.userId }).value() as User | undefined
  const token = req.headers.authorization?.replace('Bearer ', '')
  const isFavorited = token
    ? !!db.get('favorites').find({ userId: token, itemId: item.id }).value()
    : false
  res.json({
    item: {
      ...item,
      author: user ? sanitizeUser(user) : null,
      isFavorited
    }
  })
})

app.get('/api/users/:id/items', (req, res) => {
  const items = db.get('items')
    .filter({ userId: req.params.id })
    .sortBy('createdAt')
    .reverse()
    .value() as Item[]
  res.json({ items })
})

app.post('/api/items/:id/like', (req, res) => {
  const item = db.get('items').find({ id: req.params.id }).value() as Item | undefined
  if (!item) {
    return res.status(404).json({ message: '物品不存在' })
  }
  db.get('items').find({ id: req.params.id }).assign({ likes: item.likes + 1 }).write()
  const updated = db.get('items').find({ id: req.params.id }).value() as Item
  res.json({ likes: updated.likes })
})

app.get('/api/favorites', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const favorites = db.get('favorites').filter({ userId: token }).sortBy('createdAt').reverse().value() as Favorite[]
  const items = favorites.map(fav => {
    const item = db.get('items').find({ id: fav.itemId }).value() as Item | undefined
    if (!item) return null
    const user = db.get('users').find({ id: item.userId }).value() as User | undefined
    return {
      ...item,
      author: user ? sanitizeUser(user) : null
    }
  }).filter(Boolean)
  res.json({ items })
})

app.post('/api/favorites/:itemId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const item = db.get('items').find({ id: req.params.itemId }).value() as Item | undefined
  if (!item) {
    return res.status(404).json({ message: '物品不存在' })
  }
  const existing = db.get('favorites').find({ userId: token, itemId: req.params.itemId }).value() as Favorite | undefined
  if (existing) {
    return res.json({ favorited: true })
  }
  const fav: Favorite = {
    id: uuidv4(),
    userId: token,
    itemId: req.params.itemId,
    createdAt: new Date().toISOString()
  }
  db.get('favorites').push(fav).write()
  res.json({ favorited: true })
})

app.delete('/api/favorites/:itemId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  db.get('favorites').remove({ userId: token, itemId: req.params.itemId }).write()
  res.json({ favorited: false })
})

app.post('/api/exchanges', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const { fromItemId, toItemId } = req.body
  if (!fromItemId || !toItemId) {
    return res.status(400).json({ message: '请选择物品' })
  }
  const fromItem = db.get('items').find({ id: fromItemId }).value() as Item | undefined
  const toItem = db.get('items').find({ id: toItemId }).value() as Item | undefined
  if (!fromItem || !toItem) {
    return res.status(404).json({ message: '物品不存在' })
  }
  if (fromItem.userId !== token) {
    return res.status(403).json({ message: '只能用自己的物品发起交换' })
  }
  if (fromItem.userId === toItem.userId) {
    return res.status(400).json({ message: '不能和自己交换' })
  }
  if (fromItem.status !== 'available' || toItem.status !== 'available') {
    return res.status(400).json({ message: '物品已被交换，无法再次交换' })
  }
  const existing = db.get('exchanges').find({
    fromItemId, toItemId
  }).filter((e: Exchange) => ['pending', 'exchanging'].includes(e.status)).value() as Exchange | undefined
  if (existing) {
    return res.status(400).json({ message: '已存在进行中的交换请求' })
  }
  const exchange: Exchange = {
    id: uuidv4(),
    fromUserId: token,
    toUserId: toItem.userId,
    fromItemId,
    toItemId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  db.get('exchanges').push(exchange).write()
  res.json({ exchange })
})

app.get('/api/exchanges', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const exchanges = db.get('exchanges')
    .filter((e: Exchange) => e.fromUserId === token || e.toUserId === token)
    .sortBy('createdAt')
    .reverse()
    .value() as Exchange[]
  const result = exchanges.map(ex => {
    const fromItem = db.get('items').find({ id: ex.fromItemId }).value() as Item | undefined
    const toItem = db.get('items').find({ id: ex.toItemId }).value() as Item | undefined
    const fromUser = db.get('users').find({ id: ex.fromUserId }).value() as User | undefined
    const toUser = db.get('users').find({ id: ex.toUserId }).value() as User | undefined
    return {
      ...ex,
      fromItem: fromItem || null,
      toItem: toItem || null,
      fromUser: fromUser ? sanitizeUser(fromUser) : null,
      toUser: toUser ? sanitizeUser(toUser) : null
    }
  })
  res.json({ exchanges: result })
})

app.put('/api/exchanges/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
  }
  const { status } = req.body
  if (!['exchanging', 'completed', 'rejected'].includes(status)) {
    return res.status(400).json({ message: '状态值无效' })
  }
  const exchange = db.get('exchanges').find({ id: req.params.id }).value() as Exchange | undefined
  if (!exchange) {
    return res.status(404).json({ message: '交换记录不存在' })
  }
  if (status === 'exchanging' && exchange.toUserId !== token) {
    return res.status(403).json({ message: '只有接收方可以确认交换' })
  }
  if (status === 'completed' && exchange.fromUserId !== token) {
    return res.status(403).json({ message: '只有发起方可以标记完成' })
  }
  if (status === 'rejected' && exchange.toUserId !== token) {
    return res.status(403).json({ message: '只有接收方可以拒绝交换' })
  }
  db.get('exchanges').find({ id: req.params.id }).assign({
    status,
    updatedAt: new Date().toISOString()
  }).write()
  if (status === 'completed') {
    db.get('items').find({ id: exchange.fromItemId }).assign({ status: 'exchanged' }).write()
    db.get('items').find({ id: exchange.toItemId }).assign({ status: 'exchanged' }).write()
  }
  const updated = db.get('exchanges').find({ id: req.params.id }).value() as Exchange
  res.json({ exchange: updated })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`[Server] Family Swap Stories API running on http://localhost:${PORT}`)
  console.log(`[Server] Database: ${dbPath}`)
  console.log(`[Server] Uploads: ${uploadsDir}`)
})
