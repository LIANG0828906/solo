import { Router, type Request, type Response } from 'express'

const router = Router()

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageData, filename } = req.body

    if (!imageData || !filename) {
      res.status(400).json({
        success: false,
        error: 'imageData and filename are required',
      })
      return
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    res.setHeader('Content-Type', 'image/png')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}`,
    )

    res.send(imageBuffer)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process image download',
    })
  }
})

export default router
