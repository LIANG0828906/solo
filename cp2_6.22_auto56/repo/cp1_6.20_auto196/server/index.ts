import express, { Request, Response } from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

export interface Bookmark {
  id: string
  type: 'text' | 'image' | 'note'
  content: string
  category: string
  note: string
  timestamp: string
}

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

let bookmarks: Bookmark[] = [
  {
    id: uuidv4(),
    type: 'text',
    content: '设计不仅仅是外观和感觉，设计是如何工作的。',
    category: 'design',
    note: '乔布斯名言',
    timestamp: new Date().toISOString()
  },
  {
    id: uuidv4(),
    type: 'note',
    content: '学习React Hooks的最佳实践：保持组件小而专注，避免不必要的重渲染。',
    category: 'programming',
    note: '技术笔记',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: uuidv4(),
    type: 'text',
    content: '写作是思考的最佳方式，清晰的文字来自清晰的思维。',
    category: 'writing',
    note: '',
    timestamp: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: uuidv4(),
    type: 'image',
    content: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    category: 'life',
    note: '山川湖海',
    timestamp: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: uuidv4(),
    type: 'note',
    content: '好的代码像好的文章一样，应该易读、易懂、易于维护。',
    category: 'programming',
    note: '代码哲学',
    timestamp: new Date(Date.now() - 345600000).toISOString()
  }
]

app.post('/api/bookmarks', (req: Request, res: Response) => {
  const { type, content, category, note, timestamp } = req.body

  if (!type || !content || !category) {
    return res.status(400).json({ error: 'type, content, category are required' })
  }

  const newBookmark: Bookmark = {
    id: uuidv4(),
    type,
    content,
    category,
    note: note || '',
    timestamp: timestamp || new Date().toISOString()
  }

  bookmarks.unshift(newBookmark)
  return res.status(201).json(newBookmark)
})

app.get('/api/bookmarks', (req: Request, res: Response) => {
  const { category, search } = req.query
  let result = [...bookmarks]

  if (category && typeof category === 'string' && category !== 'all') {
    result = result.filter(b => b.category === category)
  }

  if (search && typeof search === 'string') {
    const lowerSearch = search.toLowerCase()
    result = result.filter(b =>
      b.content.toLowerCase().includes(lowerSearch) ||
      b.note.toLowerCase().includes(lowerSearch)
    )
  }

  return res.json(result)
})

app.delete('/api/bookmarks/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const index = bookmarks.findIndex(b => b.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'Bookmark not found' })
  }

  bookmarks.splice(index, 1)
  return res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
