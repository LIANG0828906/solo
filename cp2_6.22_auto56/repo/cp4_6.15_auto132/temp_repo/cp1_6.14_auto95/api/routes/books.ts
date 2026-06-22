import { Router, type Request, type Response } from 'express'
import { getAllBooks, getBookById, createBook, updateBook, deleteBook } from '../db/index.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { title, author, category, available } = req.query
  let books = await getAllBooks()

  if (title) {
    books = books.filter((b) => b.title.includes(String(title)))
  }
  if (author) {
    books = books.filter((b) => b.author.includes(String(author)))
  }
  if (category) {
    books = books.filter((b) => b.category === String(category))
  }
  if (available === 'true') {
    books = books.filter((b) => b.availableQuantity > 0)
  }

  res.json({ success: true, data: books })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const book = await getBookById(req.params.id)
  if (!book) {
    res.status(404).json({ success: false, message: '图书不存在' })
    return
  }

  const { db } = await import('../db/index.js')
  const loanHistory = db.data.loans.filter((l) => l.bookId === book.id)

  res.json({ success: true, data: { ...book, loanHistory } })
})

router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { title, author, category, isbn, cover, description, totalQuantity, availableQuantity } = req.body

  if (!title || !author) {
    res.status(400).json({ success: false, message: '书名和作者为必填项' })
    return
  }

  const book = await createBook({
    title,
    author,
    category: category || '',
    isbn: isbn || '',
    cover: cover || '',
    description: description || '',
    totalQuantity: totalQuantity || 1,
    availableQuantity: availableQuantity ?? totalQuantity ?? 1,
  })

  res.status(201).json({ success: true, data: book })
})

router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const updated = await updateBook(req.params.id, req.body)
  if (!updated) {
    res.status(404).json({ success: false, message: '图书不存在' })
    return
  }
  res.json({ success: true, data: updated })
})

router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const deleted = await deleteBook(req.params.id)
  if (!deleted) {
    res.status(404).json({ success: false, message: '图书不存在' })
    return
  }
  res.json({ success: true, message: '图书已删除' })
})

export default router
