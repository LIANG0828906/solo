import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { JSONFilePreset } from 'lowdb/node'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

interface Creature {
  id: string
  name: string
  scientificName: string
  habitat: string
  depthRange: string
  conservationStatus: string
  description: string
  color: string
  size: number
  speed: number
}

interface Coral {
  id: string
  name: string
  scientificName: string
  habitat: string
  depthRange: string
  conservationStatus: string
  description: string
  color: string
}

interface DbSchema {
  creatures: Creature[]
  corals: Coral[]
}

const defaultData: DbSchema = { creatures: [], corals: [] }

let dbInitialized = false
let db: any = null

async function getDb() {
  if (!dbInitialized) {
    const dbPath = path.join(__dirname, 'db.json')
    db = await JSONFilePreset<DbSchema>(dbPath, defaultData)
    dbInitialized = true
  }
  return db
}

app.get('/api/creatures', async (_req: Request, res: Response) => {
  try {
    const database = await getDb()
    res.json(database.data.creatures)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch creatures' })
  }
})

app.get('/api/corals', async (_req: Request, res: Response) => {
  try {
    const database = await getDb()
    res.json(database.data.corals)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch corals' })
  }
})

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
