import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

const db = new Database('exhibition.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS exhibitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    theme TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exhibits (
    id TEXT PRIMARY KEY,
    exhibition_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_data TEXT,
    grid_x INTEGER NOT NULL,
    grid_y INTEGER NOT NULL,
    wall_side TEXT DEFAULT 'north',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS danmaku (
    id TEXT PRIMARY KEY,
    exhibit_id TEXT NOT NULL,
    content TEXT NOT NULL,
    user_name TEXT DEFAULT '匿名访客',
    color TEXT DEFAULT '#ffffff',
    likes INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    is_reported INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exhibit_id) REFERENCES exhibits(id) ON DELETE CASCADE
  );
`)

app.get('/api/exhibitions', (req, res) => {
  const exhibitions = db.prepare('SELECT * FROM exhibitions ORDER BY created_at DESC').all()
  res.json(exhibitions)
})

app.get('/api/exhibitions/:id', (req, res) => {
  const { id } = req.params
  const exhibition = db.prepare('SELECT * FROM exhibitions WHERE id = ?').get(id)
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' })
  }
  const exhibits = db.prepare('SELECT * FROM exhibits WHERE exhibition_id = ? ORDER BY grid_y, grid_x').all(id)
  res.json({ ...exhibition, exhibits })
})

app.post('/api/exhibitions', (req, res) => {
  const { name, theme, description } = req.body
  const id = uuidv4()
  db.prepare('INSERT INTO exhibitions (id, name, theme, description) VALUES (?, ?, ?, ?)').run(id, name, theme, description)
  res.json({ id, name, theme, description })
})

app.put('/api/exhibitions/:id', (req, res) => {
  const { id } = req.params
  const { name, theme, description } = req.body
  db.prepare('UPDATE exhibitions SET name = ?, theme = ?, description = ? WHERE id = ?').run(name, theme, description, id)
  res.json({ id, name, theme, description })
})

app.delete('/api/exhibitions/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM exhibitions WHERE id = ?').run(id)
  res.json({ success: true })
})

app.get('/api/exhibitions/:id/exhibits', (req, res) => {
  const { id } = req.params
  const exhibits = db.prepare('SELECT * FROM exhibits WHERE exhibition_id = ? ORDER BY grid_y, grid_x').all(id)
  res.json(exhibits)
})

app.post('/api/exhibits', (req, res) => {
  const { exhibition_id, title, description, image_data, grid_x, grid_y, wall_side } = req.body
  const id = uuidv4()
  db.prepare(`
    INSERT INTO exhibits (id, exhibition_id, title, description, image_data, grid_x, grid_y, wall_side)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, exhibition_id, title, description, image_data, grid_x, grid_y, wall_side || 'north')
  res.json({ id, exhibition_id, title, description, image_data, grid_x, grid_y, wall_side: wall_side || 'north' })
})

app.put('/api/exhibits/:id', (req, res) => {
  const { id } = req.params
  const { title, description, image_data, grid_x, grid_y, wall_side } = req.body
  
  const updates: string[] = []
  const values: any[] = []
  
  if (title !== undefined) { updates.push('title = ?'); values.push(title) }
  if (description !== undefined) { updates.push('description = ?'); values.push(description) }
  if (image_data !== undefined) { updates.push('image_data = ?'); values.push(image_data) }
  if (grid_x !== undefined) { updates.push('grid_x = ?'); values.push(grid_x) }
  if (grid_y !== undefined) { updates.push('grid_y = ?'); values.push(grid_y) }
  if (wall_side !== undefined) { updates.push('wall_side = ?'); values.push(wall_side) }
  
  values.push(id)
  db.prepare(`UPDATE exhibits SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  
  const exhibit = db.prepare('SELECT * FROM exhibits WHERE id = ?').get(id)
  res.json(exhibit)
})

app.get('/api/exhibits/:id', (req, res) => {
  const { id } = req.params
  const exhibit = db.prepare('SELECT * FROM exhibits WHERE id = ?').get(id)
  if (!exhibit) {
    return res.status(404).json({ error: '展品不存在' })
  }
  res.json(exhibit)
})

app.delete('/api/exhibits/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM exhibits WHERE id = ?').run(id)
  res.json({ success: true })
})

app.get('/api/exhibits/:id/danmaku', (req, res) => {
  const { id } = req.params
  const danmaku = db.prepare('SELECT * FROM danmaku WHERE exhibit_id = ? AND is_visible = 1 ORDER BY created_at DESC').all(id)
  res.json(danmaku)
})

app.get('/api/exhibits/:id/danmaku/all', (req, res) => {
  const { id } = req.params
  const danmaku = db.prepare('SELECT * FROM danmaku WHERE exhibit_id = ? ORDER BY created_at DESC').all(id)
  res.json(danmaku)
})

app.post('/api/danmaku', (req, res) => {
  const { exhibit_id, content, user_name, color } = req.body
  const id = uuidv4()
  db.prepare(`
    INSERT INTO danmaku (id, exhibit_id, content, user_name, color)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, exhibit_id, content, user_name || '匿名访客', color || '#ffffff')
  
  const danmaku = db.prepare('SELECT * FROM danmaku WHERE id = ?').get(id)
  res.json(danmaku)
})

app.post('/api/danmaku/:id/like', (req, res) => {
  const { id } = req.params
  db.prepare('UPDATE danmaku SET likes = likes + 1 WHERE id = ?').run(id)
  const danmaku = db.prepare('SELECT * FROM danmaku WHERE id = ?').get(id)
  res.json(danmaku)
})

app.post('/api/danmaku/:id/report', (req, res) => {
  const { id } = req.params
  db.prepare('UPDATE danmaku SET is_reported = 1 WHERE id = ?').run(id)
  res.json({ success: true })
})

app.put('/api/danmaku/:id/visibility', (req, res) => {
  const { id } = req.params
  const { is_visible } = req.body
  db.prepare('UPDATE danmaku SET is_visible = ? WHERE id = ?').run(is_visible ? 1 : 0, id)
  const danmaku = db.prepare('SELECT * FROM danmaku WHERE id = ?').get(id)
  res.json(danmaku)
})

app.delete('/api/danmaku/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM danmaku WHERE id = ?').run(id)
  res.json({ success: true })
})

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
