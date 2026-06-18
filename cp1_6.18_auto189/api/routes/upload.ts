import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../../uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

const router = Router()

router.post('/', upload.single('roomPhoto'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const id = uuidv4()
  const filename = `${id}.jpg`
  const filepath = path.join(uploadsDir, filename)

  try {
    const info = await sharp(req.file.buffer)
      .resize(640, 480, { fit: 'inside' })
      .jpeg()
      .toFile(filepath)

    res.json({
      id,
      url: `/uploads/${filename}`,
      width: info.width,
      height: info.height,
    })
  } catch (err) {
    res.status(500).json({ error: 'Image processing failed' })
  }
})

export default router
