import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')
const THUMBNAILS_DIR = path.join(__dirname, '..', 'uploads', 'thumbnails')

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
    cb(null, UPLOADS_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG and PNG files are allowed'))
    }
  },
})

router.post(
  '/',
  authMiddleware,
  upload.array('photos', 10),
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No files uploaded' })
      return
    }

    await fs.mkdir(THUMBNAILS_DIR, { recursive: true })

    const results = await Promise.all(
      files.map(async (file) => {
        const thumbnailName = `thumb-${file.filename}`
        const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName)

        await sharp(file.path)
          .resize(200, 200, { fit: 'cover' })
          .toFile(thumbnailPath)

        return {
          url: `/uploads/${file.filename}`,
          thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
        }
      }),
    )

    res.json({ success: true, data: results })
  },
)

export default router
