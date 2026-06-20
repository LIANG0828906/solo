import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { parseAudioBuffer, type SpectrumData } from '../audioParser.js'

const router = Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
})

router.post(
  '/analyze',
  upload.single('audio'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No audio file provided',
        })
        return
      }

      const mimeType = req.file.mimetype
      const buffer = req.file.buffer

      const spectrumData: SpectrumData = await parseAudioBuffer(buffer, mimeType)

      res.status(200).json({
        success: true,
        data: spectrumData,
      })
    } catch (error) {
      console.error('Audio analysis error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze audio',
      })
    }
  },
)

export default router
