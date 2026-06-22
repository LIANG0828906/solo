import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const BOOKS_FILE = path.join(__dirname, '..', 'data', 'books.json')

async function readBooks(): Promise<any[]> {
  try {
    const data = await fs.readFile(BOOKS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeBooks(books: any[]): Promise<void> {
  await fs.writeFile(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8')
}

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const books = await readBooks()
  const userBooks = books.filter((b: any) => b.userId === req.user!.userId)
  res.json({ success: true, data: userBooks })
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { title, description } = req.body

  if (!title) {
    res.status(400).json({ success: false, error: 'Title is required' })
    return
  }

  const books = await readBooks()
  const newBook = {
    id: uuidv4(),
    userId: req.user!.userId,
    title,
    description: description || '',
    isPublished: false,
    pages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  books.push(newBook)
  await writeBooks(books)

  res.status(201).json({ success: true, data: newBook })
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const books = await readBooks()
  const book = books.find((b: any) => b.id === req.params.id)

  if (!book) {
    res.status(404).json({ success: false, error: 'Book not found' })
    return
  }

  if (!book.isPublished && book.userId !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Access denied' })
    return
  }

  res.json({ success: true, data: book })
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const books = await readBooks()
  const index = books.findIndex((b: any) => b.id === req.params.id)

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Book not found' })
    return
  }

  if (books[index].userId !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Access denied' })
    return
  }

  const { title, description, isPublished, pages } = req.body
  const updated = {
    ...books[index],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(isPublished !== undefined && { isPublished }),
    ...(pages !== undefined && { pages }),
    updatedAt: new Date().toISOString(),
  }

  books[index] = updated
  await writeBooks(books)

  res.json({ success: true, data: updated })
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const books = await readBooks()
  const index = books.findIndex((b: any) => b.id === req.params.id)

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Book not found' })
    return
  }

  if (books[index].userId !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Access denied' })
    return
  }

  books.splice(index, 1)
  await writeBooks(books)

  res.json({ success: true, data: { message: 'Book deleted' } })
})

export default router
