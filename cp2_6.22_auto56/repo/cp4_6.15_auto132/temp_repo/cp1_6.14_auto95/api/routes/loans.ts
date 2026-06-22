import { Router, type Request, type Response } from 'express'
import {
  db,
  getBookById,
  getReaderLoans,
  getReaderHistory,
  createLoan,
  returnLoan,
  getConfig,
} from '../db/index.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { bookId } = req.body
  const readerId = req.user!.id

  if (!bookId) {
    res.status(400).json({ success: false, message: '请指定借阅图书' })
    return
  }

  const book = await getBookById(bookId)
  if (!book) {
    res.status(404).json({ success: false, message: '图书不存在' })
    return
  }

  if (book.availableQuantity <= 0) {
    res.status(400).json({ success: false, message: '该图书暂无库存' })
    return
  }

  const currentLoans = await getReaderLoans(readerId)
  const config = await getConfig()

  if (currentLoans.length >= config.maxBorrowCount) {
    res.status(400).json({ success: false, message: `借阅数量已达上限（${config.maxBorrowCount}本）` })
    return
  }

  const hasOverdue = currentLoans.some((l) => l.status === 'overdue')
  if (hasOverdue) {
    res.status(400).json({ success: false, message: '您有逾期未还的图书，请先归还' })
    return
  }

  const now = new Date()
  const dueDate = new Date(now.getTime() + config.loanDays * 24 * 60 * 60 * 1000)

  const loan = await createLoan({
    bookId,
    readerId,
    borrowDate: now.toISOString(),
    dueDate: dueDate.toISOString(),
    returnDate: null,
    lateFee: 0,
    status: 'borrowed',
  })

  book.availableQuantity -= 1
  await db.write()

  res.status(201).json({ success: true, data: loan })
})

router.post('/return', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { loanId } = req.body

  if (!loanId) {
    res.status(400).json({ success: false, message: '请指定借阅记录' })
    return
  }

  await db.read()
  const loan = db.data.loans.find((l) => l.id === loanId)
  if (!loan) {
    res.status(404).json({ success: false, message: '借阅记录不存在' })
    return
  }

  if (loan.status === 'returned') {
    res.status(400).json({ success: false, message: '该图书已归还' })
    return
  }

  const now = new Date()
  const dueDate = new Date(loan.dueDate)
  let lateFee = 0

  if (now > dueDate) {
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    const config = await getConfig()
    lateFee = daysOverdue * config.lateFeePerDay
  }

  const updated = await returnLoan(loanId, now.toISOString(), lateFee)

  const book = await getBookById(loan.bookId)
  if (book) {
    book.availableQuantity += 1
    await db.write()
  }

  res.json({ success: true, data: updated })
})

router.get('/reader/:id/loans', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const loans = await getReaderLoans(req.params.id)

  const loansWithBooks = loans.map((loan) => {
    const book = db.data.books.find((b) => b.id === loan.bookId)
    return { ...loan, book: book || null }
  })

  res.json({ success: true, data: loansWithBooks })
})

router.get('/reader/:id/history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const history = await getReaderHistory(req.params.id)

  const historyWithBooks = history.map((loan) => {
    const book = db.data.books.find((b) => b.id === loan.bookId)
    return { ...loan, book: book || null }
  })

  res.json({ success: true, data: historyWithBooks })
})

export default router
