import { Router, type Request, type Response } from 'express'
import {
  db,
  getAllReaders,
  getAllLoans,
  getNotifications,
  markNotificationRead,
  updateLoanFee,
  getConfig,
  updateConfig,
  getLoanById,
  updateReader,
  deleteReader,
} from '../db/index.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/reports', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await db.read()
  const loans = db.data.loans

  const byMonth: Record<string, number> = {}
  const byCategory: Record<string, number> = {}

  for (const loan of loans) {
    const month = loan.borrowDate.slice(0, 7)
    byMonth[month] = (byMonth[month] || 0) + 1

    const book = db.data.books.find((b) => b.id === loan.bookId)
    const category = book?.category || '未知'
    byCategory[category] = (byCategory[category] || 0) + 1
  }

  const monthlyStats = Object.entries(byMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const categoryStats = Object.entries(byCategory)
    .map(([category, count]) => ({ category, count }))

  res.json({
    success: true,
    data: {
      totalLoans: loans.length,
      activeLoans: loans.filter((l) => l.status !== 'returned').length,
      overdueLoans: loans.filter((l) => l.status === 'overdue').length,
      monthlyStats,
      categoryStats,
    },
  })
})

router.get('/notifications', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { page = '1', pageSize = '20' } = req.query
  const pageNum = Number(page)
  const size = Number(pageSize)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const allNotifications = await getNotifications(sevenDaysAgo)

  allNotifications.sort((a, b) => b.sentAt.localeCompare(a.sentAt))

  const start = (pageNum - 1) * size
  const paginated = allNotifications.slice(start, start + size)

  res.json({
    success: true,
    data: {
      items: paginated,
      total: allNotifications.length,
      page: pageNum,
      pageSize: size,
    },
  })
})

router.put('/notifications/:id/read', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const notification = await markNotificationRead(req.params.id)
  if (!notification) {
    res.status(404).json({ success: false, message: '通知不存在' })
    return
  }
  res.json({ success: true, data: notification })
})

router.get('/readers', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const readers = await getAllReaders()
  const safeReaders = readers.map(({ passwordHash, ...rest }) => rest)
  res.json({ success: true, data: safeReaders })
})

router.put('/loans/:id/fee', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { fee } = req.body
  if (typeof fee !== 'number' || fee < 0) {
    res.status(400).json({ success: false, message: '请输入有效的逾期费用' })
    return
  }

  const loan = await updateLoanFee(req.params.id, fee)
  if (!loan) {
    res.status(404).json({ success: false, message: '借阅记录不存在' })
    return
  }
  res.json({ success: true, data: loan })
})

router.get('/loans', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const loans = await getAllLoans()
  const loansWithDetails = loans.map((loan) => {
    const book = db.data.books.find((b) => b.id === loan.bookId)
    const reader = db.data.readers.find((r) => r.id === loan.readerId)
    const { passwordHash, ...safeReader } = reader || {} as any
    return { ...loan, book, reader: safeReader }
  })
  res.json({ success: true, data: loansWithDetails })
})

router.get('/config', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const config = await getConfig()
  res.json({ success: true, data: config })
})

router.put('/config', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const updates = req.body
  const config = await updateConfig(updates)
  res.json({ success: true, data: config })
})

router.put('/readers/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const updates = req.body
  const reader = await updateReader(req.params.id, updates)
  if (!reader) {
    res.status(404).json({ success: false, message: '读者不存在' })
    return
  }
  const { passwordHash, ...safeReader } = reader
  res.json({ success: true, data: safeReader })
})

router.delete('/readers/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const deleted = await deleteReader(req.params.id)
  if (!deleted) {
    res.status(404).json({ success: false, message: '读者不存在' })
    return
  }
  res.json({ success: true, message: '读者已删除' })
})

export default router
