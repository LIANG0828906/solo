import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { getDB } from '../db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { files: 3 }
})

router.get('/', (req, res) => {
  const db = getDB()
  let items = [...db.data.items]

  if (req.query.category) {
    items = items.filter(item => item.category === req.query.category)
  }

  if (req.query.keyword) {
    const kw = req.query.keyword.toLowerCase()
    items = items.filter(
      item =>
        item.title.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw)
    )
  }

  items.sort((a, b) => b.createdAt - a.createdAt)
  res.json(items)
})

router.get('/:id', (req, res) => {
  const db = getDB()
  const item = db.data.items.find(i => i.id === req.params.id)
  if (!item) {
    return res.status(404).json({ error: '物品不存在' })
  }
  res.json(item)
})

router.post('/', upload.array('images', 3), async (req, res) => {
  try {
    const db = getDB()
    const imagePaths = []

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const compressedName = `compressed_${file.filename}`
        const outputPath = path.join(file.destination, compressedName)
        await sharp(file.path)
          .resize(800, null, { withoutEnlargement: true })
          .toFile(outputPath)
        imagePaths.push(`/uploads/${compressedName}`)
      }
    }

    const newItem = {
      id: uuidv4(),
      title: req.body.title || '',
      category: req.body.category || 'other',
      condition: req.body.condition || 'good',
      description: req.body.description || '',
      images: imagePaths,
      userId: req.body.userId || '',
      userName: req.body.userName || '',
      userAvatar: req.body.userAvatar || '',
      status: 'available',
      createdAt: Date.now()
    }

    db.data.items.push(newItem)
    await db.write()
    res.status(201).json(newItem)
  } catch (err) {
    res.status(500).json({ error: '创建物品失败', detail: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  const db = getDB()
  const index = db.data.items.findIndex(i => i.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: '物品不存在' })
  }
  const removed = db.data.items.splice(index, 1)[0]
  await db.write()
  res.json({ message: '删除成功', item: removed })
})

router.put('/:id', async (req, res) => {
  const db = getDB()
  const item = db.data.items.find(i => i.id === req.params.id)
  if (!item) {
    return res.status(404).json({ error: '物品不存在' })
  }

  const allowedFields = ['title', 'category', 'condition', 'description', 'images', 'status', 'userId', 'userName', 'userAvatar']
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      item[field] = req.body[field]
    }
  }

  await db.write()
  res.json(item)
})

export default router
