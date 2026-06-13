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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const dbPath = path.join(__dirname, '../data.json')
const adapter = new FileSync(dbPath)
const db = lowdb(adapter)

db.defaults({
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
  category: string
  condition: string
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

app.post('/api/auth/register', (req, res) => {
  const { username, password, nickname } = req.body
  if (!username || !password || !nickname) {
    return res.status(400).json({ message: '请填写完整信息' })
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
  const { password: _, ...userWithoutPassword } = user
  res.json({ user: userWithoutPassword, token: user.id })
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
  const { password: _, ...userWithoutPassword } = user
  res.json({ user: userWithoutPassword, token: user.id })
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
  const { password: _, ...userWithoutPassword } = user
  res.json({ user: userWithoutPassword })
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
  if (story.length < 50 || story.length > 500) {
    return res.status(400).json({ message: '故事长度需在50-500字之间' })
  }
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    return res.status(400).json({ message: '请至少上传一张照片' })
  }
  const photos = files.map(f => `/uploads/${f.filename}`)
  const item: Item = {
    id: uuidv4(),
    userId: user.id,
    name,
    category,
    condition,
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
  db.get('items').find({ id: req.params.id }).assign({
    name, category, condition, city, story, photos
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

app.get('/api/items', (req, res) => {
  const items = db.get('items').sortBy('createdAt').reverse().value() as Item[]
  const result = items.map(item => {
    const user = db.get('users').find({ id: item.userId }).value() as User | undefined
    return {
      ...item,
      author: user ? { id: user.id, nickname: user.nickname, avatar: user.avatar } : null
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
  const isFavorited = req.headers.authorization
    ? !!db.get('favorites').find({ userId: req.headers.authorization.replace('Bearer ', ''), itemId: item.id }).value()
    : false
  res.json({
    item: {
      ...item,
      author: user ? { id: user.id, nickname: user.nickname, avatar: user.avatar } : null,
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
  const favorites = db.get('favorites').filter({ userId: token }).value() as Favorite[]
  const items = favorites.map(fav => {
    const item = db.get('items').find({ id: fav.itemId }).value() as Item | undefined
    if (!item) return null
    const user = db.get('users').find({ id: item.userId }).value() as User | undefined
    return {
      ...item,
      author: user ? { id: user.id, nickname: user.nickname, avatar: user.avatar } : null
    }
  }).filter(Boolean)
  res.json({ items })
})

app.post('/api/favorites/:itemId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: '未登录' })
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
  const existing = db.get('exchanges').find({
    fromItemId, toItemId, status: 'pending'
  }).value() as Exchange | undefined
  if (existing) {
    return res.status(400).json({ message: '已存在待确认的交换请求' })
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
    .filter(e => e.fromUserId === token || e.toUserId === token)
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
      fromUser: fromUser ? { id: fromUser.id, nickname: fromUser.nickname } : null,
      toUser: toUser ? { id: toUser.id, nickname: toUser.nickname } : null
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
  const exchange = db.get('exchanges').find({ id: req.params.id }).value() as Exchange | undefined
  if (!exchange) {
    return res.status(404).json({ message: '交换记录不存在' })
  }
  if (status === 'exchanging' && exchange.toUserId !== token) {
    return res.status(403).json({ message: '无权限操作' })
  }
  if (status === 'completed' && exchange.fromUserId !== token) {
    return res.status(403).json({ message: '无权限操作' })
  }
  if (status === 'rejected' && exchange.toUserId !== token) {
    return res.status(403).json({ message: '无权限操作' })
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
