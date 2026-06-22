import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import type { Book, ReadingSession, CalendarDay } from '../shared/types.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

let books: Book[] = [
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    totalPages: 360,
    currentPage: 120,
    coverColor: '#4A90D9',
    status: 'reading',
  },
  {
    id: uuidv4(),
    title: '三体',
    author: '刘慈欣',
    totalPages: 302,
    currentPage: 0,
    coverColor: '#E74C3C',
    status: 'unread',
  },
  {
    id: uuidv4(),
    title: '小王子',
    author: '圣埃克苏佩里',
    totalPages: 97,
    currentPage: 97,
    coverColor: '#F39C12',
    status: 'finished',
  },
]

let readings: ReadingSession[] = [
  {
    id: uuidv4(),
    bookId: books[0].id,
    bookTitle: books[0].title,
    date: new Date().toISOString().slice(0, 10),
    duration: 1800,
    pagesRead: 30,
  },
]

const DAILY_GOAL_SECONDS = 1800;

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.get('/api/user/books', (_req: Request, res: Response) => {
  res.status(200).json(books)
})

app.post('/api/user/books', (req: Request, res: Response) => {
  const { title, author, totalPages, coverColor } = req.body
  if (!title || !author || !totalPages) {
    res.status(400).json({ error: 'title, author, totalPages are required' })
    return
  }
  const newBook: Book = {
    id: uuidv4(),
    title,
    author,
    totalPages: Number(totalPages),
    currentPage: 0,
    coverColor: coverColor || '#4A90D9',
    status: 'unread',
  }
  books.push(newBook)
  res.status(201).json(newBook)
})

app.patch('/api/user/books/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { currentPage, status } = req.body
  const book = books.find((b) => b.id === id)
  if (!book) {
    res.status(404).json({ error: 'Book not found' })
    return
  }
  if (currentPage !== undefined) book.currentPage = Number(currentPage)
  if (status) book.status = status
  if (book.currentPage >= book.totalPages) {
    book.currentPage = book.totalPages
    book.status = 'finished'
  }
  res.status(200).json(book)
})

app.get('/api/user/readings', (_req: Request, res: Response) => {
  res.status(200).json(readings)
})

app.post('/api/user/readings', (req: Request, res: Response) => {
  const { bookId, duration, pagesRead } = req.body
  const book = books.find((b) => b.id === bookId)
  if (!book) {
    res.status(404).json({ error: 'Book not found' })
    return
  }
  const session: ReadingSession = {
    id: uuidv4(),
    bookId,
    bookTitle: book.title,
    date: new Date().toISOString().slice(0, 10),
    duration: Number(duration),
    pagesRead: Number(pagesRead),
  }
  readings.push(session)

  book.currentPage = Math.min(book.currentPage + Number(pagesRead), book.totalPages)
  if (book.currentPage > 0 && book.status === 'unread') book.status = 'reading'
  if (book.currentPage >= book.totalPages) book.status = 'finished'

  res.status(201).json(session)
})

app.get('/api/calendar', (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear()
  const month = Number(req.query.month) || new Date().getMonth() + 1

  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const monthReadings = readings.filter((r) => r.date.startsWith(prefix))

  const dayMap = new Map<string, ReadingSession[]>()
  monthReadings.forEach((r) => {
    if (!dayMap.has(r.date)) dayMap.set(r.date, [])
    dayMap.get(r.date)!.push(r)
  })

  const daysInMonth = new Date(year, month, 0).getDate()
  const result: CalendarDay[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const sessions = dayMap.get(dateStr) || []
    const totalDuration = sessions.reduce((s, r) => s + r.duration, 0)
    const totalPages = sessions.reduce((s, r) => s + r.pagesRead, 0)
    result.push({
      date: dateStr,
      totalDuration,
      totalPages,
      goalCompleted: totalDuration >= DAILY_GOAL_SECONDS,
      sessions,
    })
  }

  res.status(200).json(result)
})

app.get('/api/user/recommendation', (_req: Request, res: Response) => {
  const readingBooks = books.filter((b) => b.status === 'reading')
  if (readingBooks.length === 0) {
    const unreadBooks = books.filter((b) => b.status === 'unread')
    if (unreadBooks.length > 0) {
      res.status(200).json({
        book: unreadBooks[0],
        suggestedMinutes: 30,
        message: `推荐开始阅读「${unreadBooks[0].title}」，建议阅读30分钟`,
      })
      return
    }
    res.status(200).json({ book: null, suggestedMinutes: 0, message: '暂无推荐' })
    return
  }

  const totalDuration = readings.reduce((s, r) => s + r.duration, 0)
  const totalPages = readings.reduce((s, r) => s + r.pagesRead, 0)
  const avgSecondsPerPage = totalDuration > 0 && totalPages > 0 ? totalDuration / totalPages : 60

  const book = readingBooks[0]
  const remaining = book.totalPages - book.currentPage
  const suggestedMinutes = Math.max(15, Math.min(60, Math.round((remaining * avgSecondsPerPage) / 60)))

  res.status(200).json({
    book,
    suggestedMinutes,
    message: `推荐继续阅读「${book.title}」，剩余${remaining}页，建议阅读${suggestedMinutes}分钟`,
  })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
