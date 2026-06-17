import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/zip']
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.zip')) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  },
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '商品主图生成服务运行中' })
})

app.post('/api/upload', upload.array('images', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const files = Array.isArray(req.files) ? req.files : [req.files]

    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
    }))

    res.json({
      success: true,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error('上传错误:', error)
    res.status(500).json({ error: '上传失败' })
  }
})

app.post('/api/generate', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { width, height, layers } = req.body

    if (!width || !height || !layers) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const filename = `generated-${Date.now()}.png`
    const filePath = path.join(uploadsDir, filename)

    console.log(`生成图片: ${width}x${height}, ${layers.length} 个图层`)

    const { createCanvas, loadImage } = await import('canvas').catch(() => null)

    if (!createCanvas) {
      return res.json({
        success: true,
        message: '后端生成服务运行中（canvas模块未安装，前端可直接生成）',
        note: '请使用前端Canvas直接生成并下载图片',
      })
    }

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    for (const layer of layers) {
      if (!layer.visible) continue

      ctx.save()

      const centerX = layer.x + layer.width / 2
      const centerY = layer.y + layer.height / 2

      ctx.translate(centerX, centerY)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)

      if (layer.type === 'image' && layer.imageSrc) {
        try {
          const imgSrc = layer.imageSrc.startsWith('data:')
            ? layer.imageSrc
            : path.join(uploadsDir, path.basename(layer.imageSrc))

          const img = await loadImage(imgSrc)

          if (layer.filter) {
            const filterParts = []
            if (layer.filter.brightness !== 1) filterParts.push(`brightness(${layer.filter.brightness})`)
            if (layer.filter.contrast !== 1) filterParts.push(`contrast(${layer.filter.contrast})`)
            if (layer.filter.hue !== 0) filterParts.push(`hue-rotate(${layer.filter.hue}deg)`)
            if (layer.filter.saturation !== 1) filterParts.push(`saturate(${layer.filter.saturation})`)
            if (layer.filter.blur > 0) filterParts.push(`blur(${layer.filter.blur}px)`)
            if (layer.filter.sepia > 0) filterParts.push(`sepia(${layer.filter.sepia})`)
            if (layer.filter.grayscale > 0) filterParts.push(`grayscale(${layer.filter.grayscale})`)

            if (filterParts.length > 0) {
              ctx.filter = filterParts.join(' ')
            }
          }

          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)
        } catch (e) {
          console.error('绘制图片图层失败:', e)
        }
      } else if (layer.type === 'text' && layer.text) {
        const t = layer.text
        ctx.font = `${t.fontWeight} ${t.fontSize}px ${t.fontFamily}`
        ctx.fillStyle = t.color
        ctx.globalAlpha = t.opacity
        ctx.textAlign = t.textAlign
        ctx.textBaseline = 'top'

        const textX = layer.x + layer.width / 2
        const textY = layer.y

        const lines = t.text.split('\n')
        const lineHeight = t.fontSize * 1.2

        lines.forEach((line, index) => {
          let x = textX
          if (t.textAlign === 'left') {
            x = layer.x
          } else if (t.textAlign === 'right') {
            x = layer.x + layer.width
          }
          ctx.fillText(line, x, textY + index * lineHeight)
        })

        ctx.globalAlpha = 1
      }

      ctx.restore()
    }

    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(filePath, buffer)

    res.json({
      success: true,
      filename,
      url: `/uploads/${filename}`,
      width,
      height,
    })
  } catch (error) {
    console.error('生成图片错误:', error)
    res.status(500).json({ error: '生成图片失败', detail: error.message })
  }
})

app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params
  const filePath = path.join(uploadsDir, filename)

  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        console.error('下载错误:', err)
        res.status(500).json({ error: '下载失败' })
      }
    })
  } else {
    res.status(404).json({ error: '文件不存在' })
  }
})

app.use('/uploads', express.static(uploadsDir))

app.listen(PORT, () => {
  console.log(`🚀 商品主图生成服务运行在 http://localhost:${PORT}`)
  console.log(`📁 上传目录: ${uploadsDir}`)
})

export default app
