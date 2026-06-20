import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from './db'
import type { Board, ImageItem, ColorItem } from './types'

const router = Router()

router.get('/boards', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 6

  await db.read()
  const allBoards = [...(db.data?.boards || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const boards = allBoards.slice(startIndex, endIndex)

  res.json({
    boards: boards.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description,
      imageCount: b.images?.length || 0,
      thumbnail: b.images?.[0]?.url || null,
      createdAt: b.createdAt,
    })),
    total: allBoards.length,
    page,
    pageSize,
    hasMore: endIndex < allBoards.length,
  })
})

router.get('/boards/:id', async (req, res) => {
  const { id } = req.params
  await db.read()
  const board = db.data?.boards?.find(b => b.id === id)

  if (!board) {
    return res.status(404).json({ error: 'Board not found' })
  }

  const sortedImages = [...board.images].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  res.json({
    ...board,
    images: sortedImages,
  })
})

router.post('/boards', async (req, res) => {
  const { title, description } = req.body

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' })
  }

  const newBoard: Board = {
    id: uuidv4(),
    title: title.trim(),
    description: description?.trim() || '',
    images: [],
    palette: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await db.read()
  db.data?.boards?.unshift(newBoard)
  await db.write()

  res.status(201).json(newBoard)
})

router.put('/boards/:id', async (req, res) => {
  const { id } = req.params
  const { title, description } = req.body

  await db.read()
  const boards = db.data?.boards || []
  const boardIndex = boards.findIndex(b => b.id === id)

  if (boardIndex === -1) {
    return res.status(404).json({ error: 'Board not found' })
  }

  if (title !== undefined) {
    boards[boardIndex].title = title.trim()
  }
  if (description !== undefined) {
    boards[boardIndex].description = description.trim()
  }
  boards[boardIndex].updatedAt = new Date().toISOString()

  await db.write()
  res.json(boards[boardIndex])
})

router.delete('/boards/:id', async (req, res) => {
  const { id } = req.params
  await db.read()
  const boards = db.data?.boards || []
  const initialLength = boards.length

  db.data!.boards = boards.filter(b => b.id !== id)
  await db.write()

  if (db.data!.boards.length === initialLength) {
    return res.status(404).json({ error: 'Board not found' })
  }

  res.json({ success: true })
})

router.put('/boards/:id/palette', async (req, res) => {
  const { id } = req.params
  const { palette } = req.body

  if (!Array.isArray(palette)) {
    return res.status(400).json({ error: 'Palette must be an array' })
  }

  await db.read()
  const boards = db.data?.boards || []
  const board = boards.find(b => b.id === id)

  if (!board) {
    return res.status(404).json({ error: 'Board not found' })
  }

  board.palette = palette as ColorItem[]
  board.updatedAt = new Date().toISOString()
  await db.write()

  res.json({ palette: board.palette })
})

router.put('/boards/:id/images/:imageId', async (req, res) => {
  const { id, imageId } = req.params
  const { composition, colors } = req.body

  await db.read()
  const boards = db.data?.boards || []
  const board = boards.find(b => b.id === id)

  if (!board) {
    return res.status(404).json({ error: 'Board not found' })
  }

  const image = board.images.find(img => img.id === imageId)
  if (!image) {
    return res.status(404).json({ error: 'Image not found' })
  }

  if (composition !== undefined) {
    image.composition = composition
  }
  if (colors !== undefined) {
    image.colors = colors
  }

  board.updatedAt = new Date().toISOString()
  await db.write()

  res.json(image)
})

router.delete('/boards/:id/images/:imageId', async (req, res) => {
  const { id, imageId } = req.params

  await db.read()
  const boards = db.data?.boards || []
  const board = boards.find(b => b.id === id)

  if (!board) {
    return res.status(404).json({ error: 'Board not found' })
  }

  const initialLength = board.images.length
  board.images = board.images.filter(img => img.id !== imageId)

  if (board.images.length === initialLength) {
    return res.status(404).json({ error: 'Image not found' })
  }

  board.updatedAt = new Date().toISOString()
  await db.write()

  res.json({ success: true })
})

export { router as boardRouter }
