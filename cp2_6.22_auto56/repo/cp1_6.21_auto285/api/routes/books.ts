import { Router, type Request, type Response } from 'express'
import { getBooks, getBookById, addBook, updateBook } from '../data/store.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const books = getBooks()
    res.status(200).json(books)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch books'
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const book = getBookById(id)
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found'
      })
      return
    }
    res.status(200).json(book)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch book'
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, author, isbn, description, coverImage, status, ownerId } = req.body
    if (!title || !author || !ownerId) {
      res.status(400).json({
        success: false,
        error: 'Title, author, and ownerId are required'
      })
      return
    }
    const newBook = addBook({
      title,
      author,
      isbn: isbn || '',
      description: description || '',
      coverImage: coverImage || '',
      status: status || 'available',
      ownerId
    })
    res.status(201).json(newBook)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create book'
    })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updatedBook = updateBook(id, req.body)
    if (!updatedBook) {
      res.status(404).json({
        success: false,
        error: 'Book not found'
      })
      return
    }
    res.status(200).json(updatedBook)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update book'
    })
  }
})

export default router
