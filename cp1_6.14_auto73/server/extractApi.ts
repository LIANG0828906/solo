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

async function extractColorsViaSharp(imagePath: string, colorCount: number = 5): Promise<ColorItem[]> {
  try {
    const image = sharp(imagePath)
    const metadata = await image.metadata()

    const regions = 6
    const cols = 3
    const rows = 2
    const regionWidth = Math.floor((metadata.width || 300) / cols)
    const regionHeight = Math.floor((metadata.height || 300) / rows)

    const regionStats: { r: number; g: number; b: number; count: number }[] = []

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        try {
          const stats = await image
            .extract({
              left: col * regionWidth,
              top: row * regionHeight,
              width: regionWidth,
              height: regionHeight,
            })
            .stats()

          const r = Math.round(stats.channels[0].mean)
          const g = Math.round(stats.channels[1].mean)
          const b = Math.round(stats.channels[2].mean)
          regionStats.push({ r, g, b, count: 1 })
        } catch {
          continue
        }
      }
    }

    const globalStats = await image.stats()
    const globalMean = {
      r: Math.round(globalStats.channels[0].mean),
      g: Math.round(globalStats.channels[1].mean),
      b: Math.round(globalStats.channels[2].mean),
    }
    regionStats.push({ ...globalMean, count: 2 })

    const merged: Map<string, { r: number; g: number; b: number; count: number }> = new Map()
    for (const s of regionStats) {
      const bucketR = Math.floor(s.r / 24) * 24
      const bucketG = Math.floor(s.g / 24) * 24
      const bucketB = Math.floor(s.b / 24) * 24
      const key = `${bucketR},${bucketG},${bucketB}`
      const existing = merged.get(key)
      if (existing) {
        existing.r = (existing.r * existing.count + s.r * s.count) / (existing.count + s.count)
        existing.g = (existing.g * existing.count + s.g * s.count) / (existing.count + s.count)
        existing.b = (existing.b * existing.count + s.b * s.count) / (existing.count + s.count)
        existing.count += s.count
      } else {
        merged.set(key, { r: s.r, g: s.g, b: s.b, count: s.count })
      }
    }

    const sorted = Array.from(merged.values())
      .sort((a, b) => b.count - a.count)

    const selected: ColorItem[] = []
    for (const c of sorted) {
      const rgb: [number, number, number] = [Math.round(c.r), Math.round(c.g), Math.round(c.b)]
      const hex = rgbToHex(rgb[0], rgb[1], rgb[2])

      const tooClose = selected.some(s => {
        const dr = s.rgb[0] - rgb[0]
        const dg = s.rgb[1] - rgb[1]
        const db = s.rgb[2] - rgb[2]
        return Math.sqrt(dr * dr + dg * dg + db * db) < 50
      })

      if (!tooClose) {
        selected.push({ hex, rgb })
      }

      if (selected.length >= colorCount) break
    }

    while (selected.length < colorCount) {
      const idx = selected.length
      const r = Math.round(globalMean.r + (idx * 40) % 200 - 100)
      const g = Math.round(globalMean.g + (idx * 70) % 200 - 100)
      const b = Math.round(globalMean.b + (idx * 30) % 200 - 100)
      selected.push({
        hex: rgbToHex(
          Math.max(0, Math.min(255, r)),
          Math.max(0, Math.min(255, g)),
          Math.max(0, Math.min(255, b))
        ),
        rgb: [
          Math.max(0, Math.min(255, r)),
          Math.max(0, Math.min(255, g)),
          Math.max(0, Math.min(255, b)),
        ],
      })
    }

    return selected
  } catch (error) {
    console.error('Error extracting colors via sharp stats:', error)
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

    const colors = await extractColorsViaSharp(imagePath, 5)
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
