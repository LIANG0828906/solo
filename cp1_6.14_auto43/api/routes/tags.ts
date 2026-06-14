import { Router, type Request, type Response } from 'express'
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

const router = Router()

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureDb()
    const sorted = [...db.data.tags].sort((a, b) => b.order - a.order)
    res.json(sorted)
  } catch {
    res.status(500).json({ error: 'Failed to fetch tags' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
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

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
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

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
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

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDb()
    const q = (req.query.q as string || '').toLowerCase().trim()
    if (!q) {
      res.json([])
      return
    }
    const results = db.data.tags.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.url.toLowerCase().includes(q)
    )
    const sorted = results.sort((a, b) => b.order - a.order)
    res.json(sorted)
  } catch {
    res.status(500).json({ error: 'Search failed' })
  }
})

export default router
