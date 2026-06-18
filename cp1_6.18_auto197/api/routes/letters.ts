import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import {
  getAllLetters,
  getLetterById,
  createLetter,
  updateLetter,
  recallLetter,
  getRecycledLetters,
} from '../letterService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}${ext}`)
  },
})

const upload = multer({ storage })

const router = Router()

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const letters = await getAllLetters()
  res.json(letters)
})

router.get('/recycle/list', async (_req: Request, res: Response): Promise<void> => {
  const recycled = await getRecycledLetters()
  res.json(recycled)
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const letter = await getLetterById(req.params.id)
  if (!letter) {
    res.status(404).json({ success: false, error: 'Letter not found' })
    return
  }
  res.json(letter)
})

router.post('/', upload.single('photo'), async (req: Request, res: Response): Promise<void> => {
  const { toEmail, subject, content, sendDate, mood } = req.body
  const photo = req.file ? `/uploads/${req.file.filename}` : undefined
  const letter = await createLetter({ toEmail, subject, content, sendDate, mood, photo })
  res.status(201).json(letter)
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const letter = await updateLetter(req.params.id, req.body)
  if (!letter) {
    res.status(404).json({ success: false, error: 'Letter not found' })
    return
  }
  res.json(letter)
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const success = await recallLetter(req.params.id)
  res.json({ success })
})

export default router
