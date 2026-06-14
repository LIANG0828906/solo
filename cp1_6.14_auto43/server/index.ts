import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import { JSONFile, Low } from 'lowdb'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Tag {
  id: string
  title: string
  url: string
  group: 'work' | 'study' | 'life' | 'other'
  savedAt: string
  order: number
}

interface DbSchema {
  tags: Tag[]
}

const dbPath = path.resolve(__dirname, '..', 'tags.json')
const adapter = new JSONFile<DbSchema>(dbPath)
const db = new Low<DbSchema>(adapter, { tags: [] })

async function ensureDb() {
  await db.read()
  if (!db.data) {
    db.data = { tags: [] }
    await db.write()
  }
}

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/tags', async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureDb()
    const sorted = [...db.data.tags].sort((a, b) => b.order - a.order)
    res.json(sorted)
  } catch {
    res.status(500).json({ error: 'Failed to fetch tags' })
  }
})

app.post('/api/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDb()
    const { title, url, group } = req.body
    if (!title || !url) {
      res.status(400).json({ error: 'Title and URL are required' })
      return
    }
    const maxOrder = db.data.tags.reduce((max, t) => Math.max(max, t.order), -1)
    const newTag: Tag = {
      id: uuidv4(),
      title,
      url,
      group: group || 'other',
      savedAt: new Date().toISOString(),
      order: maxOrder + 1,
    }
    db.data.tags.push(newTag)
    await db.write()
    res.status(201).json(newTag)
  } catch {
    res.status(500).json({ error: 'Failed to create tag' })
  }
})

app.put('/api/tags/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDb()
    const { id } = req.params
    const idx = db.data.tags.findIndex((t) => t.id === id)
    if (idx === -1) {
      res.status(404).json({ error: 'Tag not found' })
      return
    }
    const { title, url, group, order } = req.body
    if (title !== undefined) db.data.tags[idx].title = title
    if (url !== undefined) db.data.tags[idx].url = url
    if (group !== undefined) db.data.tags[idx].group = group
    if (order !== undefined) db.data.tags[idx].order = order
    await db.write()
    res.json(db.data.tags[idx])
  } catch {
    res.status(500).json({ error: 'Failed to update tag' })
  }
})

app.delete('/api/tags/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDb()
    const { id } = req.params
    const idx = db.data.tags.findIndex((t) => t.id === id)
    if (idx === -1) {
      res.status(404).json({ error: 'Tag not found' })
      return
    }
    db.data.tags.splice(idx, 1)
    await db.write()
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete tag' })
  }
})

app.get('/api/tags/search', async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDb()
    const qRaw = typeof req.query.q === 'string' ? req.query.q : ''
    const q = qRaw.trim().toLowerCase()

    if (!q) {
      res.json([])
      return
    }

    const results: Tag[] = []
    for (const t of db.data.tags) {
      const titleLower = (t.title || '').toLowerCase()
      const urlLower = (t.url || '').toLowerCase()
      if (titleLower.includes(q) || urlLower.includes(q)) {
        results.push(t)
      }
    }

    results.sort((a, b) => b.order - a.order)
    res.json(results)
  } catch {
    res.status(500).json({ error: 'Search failed' })
  }
})

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.use((_error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})
