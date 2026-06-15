import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import type { Book, DriftLog } from '../types'

const router = express.Router()

router.get('/', async (req, res) => {
  await db.read()
  const { dropPointId } = req.query
  let books = db.data.books

  if (dropPointId) {
    books = books.filter(b => b.dropPointId === dropPointId)
  }

  const booksWithRating = books.map(b => ({
    ...b,
    avgRating: b.ratingCount > 0 ? Math.round((b.totalRating / b.ratingCount) * 10) / 10 : 0,
  }))

  res.json({ books: booksWithRating })
})

router.get('/:id', async (req, res) => {
  await db.read()
  const { id } = req.params

  const book = db.data.books.find(b => b.id === id)
  if (!book) {
    return res.status(404).json({ error: '图书不存在' })
  }

  const logs = db.data.driftLogs
    .filter(l => l.bookId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const bookWithRating = {
    ...book,
    avgRating: book.ratingCount > 0 ? Math.round((book.totalRating / book.ratingCount) * 10) / 10 : 0,
  }

  res.json({ book: bookWithRating, logs })
})

router.post('/', async (req, res) => {
  await db.read()

  const sessionUserId = req.session.userId
  if (!sessionUserId) {
    return res.status(401).json({ error: '请先登录' })
  }

  const { title, author, isbn, publishYear, description, dropPointId, coverUrl } = req.body

  if (!title || !author || !dropPointId || !coverUrl) {
    return res.status(400).json({ error: '请填写完整信息' })
  }

  const newBook: Book = {
    id: uuidv4(),
    title,
    author,
    isbn: isbn || '',
    publishYear: Number(publishYear) || 0,
    description: description || '',
    coverUrl,
    dropPointId,
    ownerId: sessionUserId,
    status: 'available',
    currentBorrowerId: null,
    borrowCount: 0,
    totalRating: 0,
    ratingCount: 0,
  }

  db.data.books.push(newBook)
  await db.write()

  res.status(201).json({ book: newBook })
})

router.post('/:id/borrow', async (req, res) => {
  await db.read()
  const { id } = req.params
  const sessionUserId = req.session.userId

  if (!sessionUserId) {
    return res.status(401).json({ error: '请先登录' })
  }

  const book = db.data.books.find(b => b.id === id)
  if (!book) {
    return res.status(404).json({ error: '图书不存在' })
  }

  if (book.status === 'borrowed') {
    return res.status(400).json({ error: '该书已被借阅' })
  }

  book.status = 'borrowed'
  book.currentBorrowerId = sessionUserId
  book.borrowCount += 1
  await db.write()

  res.json({ success: true, requestId: uuidv4() })
})

router.post('/:id/return', async (req, res) => {
  await db.read()
  const { id } = req.params
  const sessionUserId = req.session.userId

  if (!sessionUserId) {
    return res.status(401).json({ error: '请先登录' })
  }

  const book = db.data.books.find(b => b.id === id)
  if (!book) {
    return res.status(404).json({ error: '图书不存在' })
  }

  if (book.currentBorrowerId !== sessionUserId) {
    return res.status(403).json({ error: '无权操作' })
  }

  book.status = 'available'
  book.currentBorrowerId = null
  await db.write()

  res.json({ success: true })
})

router.post('/:id/logs', async (req, res) => {
  await db.read()
  const { id } = req.params
  const sessionUserId = req.session.userId

  if (!sessionUserId) {
    return res.status(401).json({ error: '请先登录' })
  }

  const { content, rating } = req.body

  if (!content || content.length < 50) {
    return res.status(400).json({ error: '漂流心得至少需要50字' })
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' })
  }

  const book = db.data.books.find(b => b.id === id)
  if (!book) {
    return res.status(404).json({ error: '图书不存在' })
  }

  const user = db.data.users.find(u => u.id === sessionUserId)

  const newLog: DriftLog = {
    id: uuidv4(),
    bookId: id,
    userId: sessionUserId,
    username: user?.username || '匿名用户',
    content,
    rating: Number(rating),
    createdAt: new Date().toISOString(),
  }

  db.data.driftLogs.push(newLog)

  book.totalRating += Number(rating)
  book.ratingCount += 1

  await db.write()

  res.status(201).json({ log: newLog })
})

export default router
