import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import uploadRouter from './routes/upload.js'
import sceneRouter from './routes/scene.js'
import furnitureRouter from './routes/furniture.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/upload', uploadRouter)
app.use('/api/scene', sceneRouter)
app.use('/api/furniture', furnitureRouter)

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.use((_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'API not found' })
})

app.use((_error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  res.status(500).json({ success: false, error: 'Server internal error' })
})

export default app
