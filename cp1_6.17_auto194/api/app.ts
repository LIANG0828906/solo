import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const DATA_DIR = path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const ASSETS = {
  sprites: [
    { id: 'knight', name: '骑士', category: 'sprite', width: 14, height: 14 },
    { id: 'mage', name: '法师', category: 'sprite', width: 14, height: 14 },
    { id: 'archer', name: '弓箭手', category: 'sprite', width: 14, height: 14 },
    { id: 'slime', name: '史莱姆', category: 'sprite', width: 14, height: 14 },
    { id: 'villager', name: '村民', category: 'sprite', width: 14, height: 14 },
    { id: 'cat', name: '猫咪', category: 'sprite', width: 14, height: 14 },
  ],
  props: [
    { id: 'torch', name: '火把', category: 'prop', width: 8, height: 8 },
    { id: 'chest', name: '箱子', category: 'prop', width: 8, height: 8 },
    { id: 'bucket', name: '水桶', category: 'prop', width: 8, height: 8 },
    { id: 'tree', name: '树', category: 'prop', width: 8, height: 8 },
    { id: 'rock', name: '石头', category: 'prop', width: 8, height: 8 },
    { id: 'potion', name: '药水', category: 'prop', width: 8, height: 8 },
    { id: 'sword', name: '宝剑', category: 'prop', width: 8, height: 8 },
    { id: 'key', name: '钥匙', category: 'prop', width: 8, height: 8 },
  ],
  bubbles: [
    { id: 'speech', name: '对话气泡', category: 'bubble', width: 16, height: 8 },
    { id: 'thought', name: '思考气泡', category: 'bubble', width: 16, height: 8 },
    { id: 'exclaim', name: '感叹', category: 'bubble', width: 16, height: 8 },
    { id: 'question', name: '疑问', category: 'bubble', width: 16, height: 8 },
    { id: 'heart', name: '爱心', category: 'bubble', width: 16, height: 8 },
    { id: 'star', name: '星星', category: 'bubble', width: 16, height: 8 },
  ],
}

app.get('/api/assets', (_req: Request, res: Response) => {
  res.json(ASSETS)
})

app.post('/api/projects', (req: Request, res: Response) => {
  try {
    const project = req.body
    const id = project.id || uuidv4()
    project.id = id
    project.updatedAt = new Date().toISOString()

    const filePath = path.join(DATA_DIR, `${id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2))

    res.json({ success: true, id })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save project' })
  }
})

app.get('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(DATA_DIR, `${req.params.id}.json`)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Project not found' })
      return
    }
    const data = fs.readFileSync(filePath, 'utf-8')
    res.json(JSON.parse(data))
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load project' })
  }
})

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
