import { Router } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { db } from '../db.js'
import type { Sound, SoundCategory } from '../../shared/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm'
    const filename = `${uuidv4()}${ext}`
    cb(null, filename)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/mpeg', 'audio/wav']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的音频格式'))
    }
  },
})

const router = Router()

router.get('/', async (_req, res) => {
  try {
    await db.read()
    const sounds = db.data?.sounds || []
    res.json(sounds)
  } catch (error) {
    res.status(500).json({ error: '获取声音列表失败' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    await db.read()
    const sound = db.data?.sounds.find((s) => s.id === req.params.id)
    if (!sound) {
      return res.status(404).json({ error: '声音不存在' })
    }
    res.json(sound)
  } catch (error) {
    res.status(500).json({ error: '获取声音详情失败' })
  }
})

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传音频文件' })
    }

    const {
      title,
      category,
      lat,
      lng,
      duration,
      uploader,
      description,
      tags,
    } = req.body

    if (!title || !category || !lat || !lng || !duration) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const durationNum = parseFloat(duration)
    if (durationNum < 5 || durationNum > 60) {
      return res.status(400).json({ error: '录音时长需在5-60秒之间' })
    }

    const tagArray = tags ? (Array.isArray(tags) ? tags : [tags]) : []
    const limitedTags = tagArray.slice(0, 3).map((t: string) => String(t))

    const newSound: Sound = {
      id: uuidv4(),
      title: String(title),
      fileName: req.file.filename,
      category: category as SoundCategory,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      duration: durationNum,
      uploader: uploader || '匿名用户',
      uploadTime: new Date().toISOString(),
      description: description || '',
      tags: limitedTags,
      likes: 0,
      reports: 0,
      isReported: false,
    }

    await db.read()
    if (!db.data) {
      db.data = { sounds: [] }
    }
    db.data.sounds.unshift(newSound)
    await db.write()

    res.status(201).json(newSound)
  } catch (error) {
    res.status(500).json({ error: '上传失败' })
  }
})

router.post('/:id/like', async (req, res) => {
  try {
    await db.read()
    const sound = db.data?.sounds.find((s) => s.id === req.params.id)
    if (!sound) {
      return res.status(404).json({ error: '声音不存在' })
    }
    sound.likes += 1
    await db.write()
    res.json({ likes: sound.likes })
  } catch (error) {
    res.status(500).json({ error: '点赞失败' })
  }
})

router.post('/:id/report', async (req, res) => {
  try {
    await db.read()
    const sound = db.data?.sounds.find((s) => s.id === req.params.id)
    if (!sound) {
      return res.status(404).json({ error: '声音不存在' })
    }
    sound.reports += 1
    sound.isReported = true
    await db.write()
    res.json({ reports: sound.reports, isReported: sound.isReported })
  } catch (error) {
    res.status(500).json({ error: '举报失败' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.read()
    const sounds = db.data?.sounds || []
    const soundIndex = sounds.findIndex((s) => s.id === req.params.id)
    if (soundIndex === -1) {
      return res.status(404).json({ error: '声音不存在' })
    }

    const sound = sounds[soundIndex]
    const filePath = path.join(uploadsDir, sound.fileName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    sounds.splice(soundIndex, 1)
    await db.write()
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ error: '删除失败' })
  }
})

export default router
