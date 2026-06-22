import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import notes from './seedData.js'
import { searchNotes, aggregateByTag, filterByTag } from './searchEngine.js'
import { addQA, getSortedQA } from './qaHandler.js'

const app: express.Application = express()

app.use(cors())
app.use(express.json())

app.get('/api/notes', (_req: Request, res: Response) => {
  const { tag, search } = _req.query
  let result = [...notes]

  if (typeof tag === 'string' && tag) {
    result = filterByTag(result, tag)
  }

  if (typeof search === 'string' && search) {
    result = searchNotes(result, search)
  }

  const tagCounts = aggregateByTag(notes)

  res.json({ notes: result, tagCounts })
})

app.get('/api/notes/:id', (req: Request, res: Response) => {
  const note = notes.find((n) => n.id === req.params.id)
  if (!note) {
    res.status(404).json({ error: 'Note not found' })
    return
  }
  res.json({ note, qa: getSortedQA(note) })
})

app.post('/api/notes/:id/qa', (req: Request, res: Response) => {
  const note = notes.find((n) => n.id === req.params.id)
  if (!note) {
    res.status(404).json({ error: 'Note not found' })
    return
  }
  const { question } = req.body
  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Question is required' })
    return
  }
  const qa = addQA(note, question)
  res.json(qa)
})

app.use(
  '/api/health',
  (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'ok' })
  }
)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'API not found' })
})

export default app
