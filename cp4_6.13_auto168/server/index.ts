import express from 'express'
import { Request, Response } from 'express'

const app = express()
const PORT = 5000

app.use(express.json({ limit: '10mb' }))

app.post('/save-image', (req: Request, res: Response) => {
  try {
    const { image } = req.body
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      })
    }
    
    console.log('Received screenshot data (length:', image.length, ')')
    
    res.json({
      success: true,
      message: 'Image received successfully (placeholder endpoint)',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving image:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

export default app
