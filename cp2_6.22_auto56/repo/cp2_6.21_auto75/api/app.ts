/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { handleExportPdf } from '../src/backend/pdfService.js'
import { handleCreateShare, handleGetShare, handleGetSharePreview, buildShareViewHtml } from '../src/backend/shareService.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

/**
 * API Routes
 */
app.post('/api/export-pdf', handleExportPdf)
app.post('/api/share', handleCreateShare)
app.get('/api/share/:token', handleGetShare)
app.get('/s/:token', (req: Request, res: Response) => {
  const token = req.params.token
  const entry = handleGetSharePreview(token)
  if (!entry) {
    res.status(404).send('分享链接不存在或已过期')
    return
  }
  const html = buildShareViewHtml(entry)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
