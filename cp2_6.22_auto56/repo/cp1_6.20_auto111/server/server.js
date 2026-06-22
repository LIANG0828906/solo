import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001
const DATA_PATH = path.join(__dirname, 'data.json')

app.use(cors())
app.use(express.json())

const readData = () => {
  const data = fs.readFileSync(DATA_PATH, 'utf-8')
  return JSON.parse(data)
}

const writeData = (data) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

app.get('/api/poems', (_req, res) => {
  try {
    const data = readData()
    res.json({ poems: data.poems })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch poems' })
  }
})

app.get('/api/poems/:id', (req, res) => {
  try {
    const { id } = req.params
    const data = readData()
    const poem = data.poems.find(p => p.id === id)
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' })
    }
    res.json({ poem })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch poem' })
  }
})

app.get('/api/poems/:id/comments', (req, res) => {
  try {
    const { id } = req.params
    const data = readData()
    const comments = data.comments.filter(c => c.poemId === id)
    res.json({ comments })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

app.post('/api/comments', (req, res) => {
  try {
    const { poemId, author, content, mentions = [] } = req.body
    
    if (!poemId || !author || !content) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const newComment = {
      id: uuidv4(),
      poemId,
      author,
      content,
      mentions,
      createdAt: new Date().toISOString()
    }

    const data = readData()
    data.comments.push(newComment)
    writeData(data)

    res.status(201).json({ comment: newComment })
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment' })
  }
})

app.post('/api/poems/:id/like', (req, res) => {
  try {
    const { id } = req.params
    const data = readData()
    const poem = data.poems.find(p => p.id === id)
    
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' })
    }

    poem.likes += 1
    writeData(data)

    res.json({ likes: poem.likes })
  } catch (error) {
    res.status(500).json({ error: 'Failed to like poem' })
  }
})

app.listen(PORT, () => {
  console.log(`PoemCanvas server running on port ${PORT}`)
})
