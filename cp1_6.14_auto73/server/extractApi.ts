import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { db } from './db'
import type { ColorItem, ImageItem } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

const uploadsDir = path.join(__dirname, '..', 'uploads')
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error)

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const filename = `${uuidv4()}${ext}`
    cb(null, filename)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 JPG、PNG、WebP 格式的图片'))
    }
  },
})

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

async function extractColors(imagePath: string, colorCount: number = 5): Promise<ColorItem[]> {
  try {
    const image = sharp(imagePath)
    const metadata = await image.metadata()
    const resizeWidth = Math.min(metadata.width || 400, 200)

    const { data, info } = await image
      .resize(resizeWidth)
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixelCount = info.width * info.height
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>()
    const step = Math.max(1, Math.floor(pixelCount / 10000))

    for (let i = 0; i < pixelCount; i += step) {
      const idx = i * info.channels
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const bucketR = Math.floor(r / 10) * 10
      const bucketG = Math.floor(g / 10) * 10
      const bucketB = Math.floor(b / 10) * 10
      const key = `${bucketR},${bucketG},${bucketB}`

      const existing = colorMap.get(key)
      if (existing) {
        existing.r += r
        existing.g += g
        existing.b += b
        existing.count += 1
      } else {
        colorMap.set(key, { r, g, b, count: 1 })
      }
    }

    const colors = Array.from(colorMap.values())
      .map(c => ({
        rgb: [Math.round(c.r / c.count), Math.round(c.g / c.count), Math.round(c.b / c.count)] as [number, number, number],
        count: c.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, colorCount)
      .map(c => ({
        hex: rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]),
        rgb: c.rgb,
      }))

    return colors.length > 0 ? colors : [
      { hex: '#64748b', rgb: [100, 116, 139] },
    ]
  } catch (error) {
    console.error('Error extracting colors:', error)
    return [
      { hex: '#64748b', rgb: [100, 116, 139] },
    ]
  }
}

function analyzeComposition(width: number, height: number): string {
  const ratio = width / height
  const compositions: string[] = []

  if (Math.abs(ratio - 1) < 0.1) {
    compositions.push('对称构图')
  }

  if (ratio > 1.5) {
    compositions.push('宽幅构图')
  } else if (ratio < 0.7) {
    compositions.push('竖幅构图')
  }

  if (compositions.length === 0) {
    compositions.push('三分法构图')
  }

  if (Math.random() > 0.5) {
    compositions.push('对角线引导')
  }

  return compositions[0] || '自然构图'
}

router.post('/extract/:boardId', upload.single('image'), async (req, res) => {
  const { boardId } = req.params

  if (!req.file) {
    return res.status(400).json({ error: '未接收到图片文件' })
  }

  try {
    const imagePath = req.file.path
    const filename = req.file.filename

    const metadata = await sharp(imagePath).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    const colors = await extractColors(imagePath, 5)
    const composition = analyzeComposition(width, height)

    const imageItem: ImageItem = {
      id: uuidv4(),
      filename,
      originalName: req.file.originalname,
      path: imagePath,
      url: `/uploads/${filename}`,
      width,
      height,
      colors,
      composition,
      createdAt: new Date().toISOString(),
    }

    await db.read()
    const boards = db.data?.boards || []
    const board = boards.find(b => b.id === boardId)

    if (board) {
      board.images.unshift(imageItem)
      board.updatedAt = new Date().toISOString()
      await db.write()
    }

    res.json({
      image: imageItem,
    })
  } catch (error) {
    console.error('Error processing image:', error)
    res.status(500).json({ error: '处理图片时出错' })
  }
})

export { router as extractRouter }
