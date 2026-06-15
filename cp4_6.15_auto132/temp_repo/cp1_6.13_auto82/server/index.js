import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import ogs from 'open-graph-scraper'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]):\//, '$1:/'), '../data')
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json')
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json')

const ensureDataFiles = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  
  if (!fs.existsSync(BOOKMARKS_FILE)) {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify([], null, 2))
  }
  
  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify([
      { id: 'uncategorized', name: '未分类', color: '#6366f1' },
      { id: 'favorites', name: '喜欢的', color: '#ec4899' },
      { id: 'reading', name: '待读', color: '#10b981' }
    ], null, 2))
  }
}

const readBookmarks = () => {
  ensureDataFiles()
  const data = fs.readFileSync(BOOKMARKS_FILE, 'utf-8')
  return JSON.parse(data)
}

const writeBookmarks = (bookmarks) => {
  fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2))
}

const readCategories = () => {
  ensureDataFiles()
  const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8')
  return JSON.parse(data)
}

app.get('/api/bookmarks', (req, res) => {
  const bookmarks = readBookmarks()
  res.json(bookmarks)
})

app.get('/api/categories', (req, res) => {
  const categories = readCategories()
  res.json(categories)
})

app.post('/api/bookmarks', async (req, res) => {
  const { url } = req.body
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }
  
  let title = '未知站点'
  let description = ''
  let favicon = null
  
  try {
    const result = await ogs({ url })
    if (result.success && result.result) {
      title = result.result.ogTitle || result.result.title || '未知站点'
      description = result.result.ogDescription || result.result.description || ''
      favicon = result.result.favicon || null
    }
  } catch {
    favicon = null
  }
  
  const bookmark = {
    id: uuidv4(),
    url,
    title,
    description,
    favicon,
    category: 'uncategorized',
    note: '',
    createdAt: Date.now(),
    position: 0
  }
  
  const bookmarks = readBookmarks()
  bookmark.position = bookmarks.length
  bookmarks.push(bookmark)
  writeBookmarks(bookmarks)
  
  res.json(bookmark)
})

app.put('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params
  const { category, position } = req.body
  
  let bookmarks = readBookmarks()
  const index = bookmarks.findIndex(b => b.id === id)
  
  if (index === -1) {
    return res.status(404).json({ error: 'Bookmark not found' })
  }
  
  if (category !== undefined) {
    bookmarks[index].category = category
  }
  if (position !== undefined) {
    bookmarks[index].position = position
  }
  
  writeBookmarks(bookmarks)
  res.json(bookmarks[index])
})

app.put('/api/bookmarks/:id/note', (req, res) => {
  const { id } = req.params
  const { note } = req.body
  
  let bookmarks = readBookmarks()
  const index = bookmarks.findIndex(b => b.id === id)
  
  if (index === -1) {
    return res.status(404).json({ error: 'Bookmark not found' })
  }
  
  bookmarks[index].note = note.slice(0, 200)
  writeBookmarks(bookmarks)
  res.json(bookmarks[index])
})

app.delete('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params
  
  let bookmarks = readBookmarks()
  bookmarks = bookmarks.filter(b => b.id !== id)
  
  bookmarks = bookmarks.map((b, index) => ({ ...b, position: index }))
  writeBookmarks(bookmarks)
  
  res.json({ success: true })
})

app.listen(PORT, () => {
  ensureDataFiles()
  console.log(`Server running on http://localhost:${PORT}`)
})