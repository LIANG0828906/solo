import { Router, type Request, type Response } from 'express'
import { dataStore } from '../models/dataStore.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const sort = req.query.sort as string | undefined
  let books = dataStore.books.getAll()
  if (sort === 'title') {
    books.sort((a, b) => a.title.localeCompare(b.title, 'zh'))
  } else if (sort === 'author') {
    books.sort((a, b) => a.author.localeCompare(b.author, 'zh'))
  } else {
    books.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
  }
  res.json({ success: true, data: books })
})

router.post('/', (req: Request, res: Response): void => {
  const { title, author, coverUrl, description, isbn, totalChapters } = req.body
  if (!title || !author) {
    res.status(400).json({ success: false, error: 'title and author are required' })
    return
  }
  const book = dataStore.books.create({
    title,
    author,
    coverUrl: coverUrl || '',
    description: description || '',
    isbn: isbn || '',
    totalChapters: totalChapters || 0,
  })
  res.status(201).json({ success: true, data: book })
})

router.get('/:id', (req: Request, res: Response): void => {
  const book = dataStore.books.getById(req.params.id)
  if (!book) {
    res.status(404).json({ success: false, error: 'Book not found' })
    return
  }
  res.json({ success: true, data: book })
})

router.put('/:id', (req: Request, res: Response): void => {
  const book = dataStore.books.update(req.params.id, req.body)
  if (!book) {
    res.status(404).json({ success: false, error: 'Book not found' })
    return
  }
  res.json({ success: true, data: book })
})

router.get('/:id/progress', (req: Request, res: Response): void => {
  const book = dataStore.books.getById(req.params.id)
  if (!book) {
    res.status(404).json({ success: false, error: 'Book not found' })
    return
  }
  const progress = dataStore.readingProgress.getByBookId(req.params.id)
  const enriched = progress.map(p => {
    const member = dataStore.members.getById(p.memberId)
    return { ...p, memberName: member?.name, memberAvatar: member?.avatar }
  })
  res.json({ success: true, data: enriched })
})

router.post('/:id/progress', (req: Request, res: Response): void => {
  const { memberId, currentChapter, thought } = req.body
  if (!memberId) {
    res.status(400).json({ success: false, error: 'memberId is required' })
    return
  }
  const book = dataStore.books.getById(req.params.id)
  if (!book) {
    res.status(404).json({ success: false, error: 'Book not found' })
    return
  }
  const chapter = currentChapter ?? 0
  const progress = dataStore.readingProgress.upsert(memberId, req.params.id, chapter, book.totalChapters)
  if (thought) {
    dataStore.checkIns.create({ memberId, bookId: req.params.id, chapter, thought })
  }
  res.status(201).json({ success: true, data: progress })
})

router.get('/:id/checkins', (req: Request, res: Response): void => {
  const book = dataStore.books.getById(req.params.id)
  if (!book) {
    res.status(404).json({ success: false, error: 'Book not found' })
    return
  }
  const checkins = dataStore.checkIns.getByBookId(req.params.id)
  const enriched = checkins.map(c => {
    const member = dataStore.members.getById(c.memberId)
    return { ...c, memberName: member?.name, memberAvatar: member?.avatar }
  })
  res.json({ success: true, data: enriched })
})

export default router
