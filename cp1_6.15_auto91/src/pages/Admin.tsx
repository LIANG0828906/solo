import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Dialog from '@/components/Dialog'
import { BookCardSkeleton } from '@/components/BookCard'
import Empty from '@/components/Empty'
import { getBooks, reviewBook, getTransactions, type Book, type Transaction } from '@/api'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

type TabType = 'review' | 'transactions'
type SortOrder = 'asc' | 'desc'
type TransactionStatusFilter = 'all' | 'pending' | 'confirmed' | 'completed'

const categoryLabels: Record<string, string> = {
  novel: '小说',
  documentary: '纪实',
  technology: '科技',
  art: '艺术',
  life: '生活',
}

const transactionTypeLabels: Record<string, string> = {
  exchange: '交换',
  sale: '出售',
}

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
}

const statusFilterLabels: Record<string, string> = {
  all: '全部',
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
}

interface ReviewBookCardProps {
  book: Book
  index: number
  onApprove: (id: string) => void
  onReject: (book: Book) => void
  isRemoving: boolean
}

function ReviewBookCard({ book, index, onApprove, onReject, isRemoving }: ReviewBookCardProps) {
  const staggerClass = `stagger-${Math.min(index % 8 + 1, 8)}`

  return (
    <div
      className={cn(
        'book-card animate-card-unfold book-card-pending',
        staggerClass,
        isRemoving && 'animate-card-flip-out'
      )}
      style={{ perspective: '1000px' }}
    >
      <div className="book-card-image">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-wood-cream/60 text-4xl font-serif">
            {book.title?.charAt(0) || '书'}
          </div>
        )}
      </div>

      <div className="book-card-title" title={book.title}>
        {book.title}
      </div>

      <div className="book-card-author">
        {book.author}
      </div>

      <div className="book-card-meta">
        <span className="tag text-xs">
          {categoryLabels[book.category] || book.category}
        </span>
        <div className="flex items-center gap-2">
          <span className="tag text-xs">
            {transactionTypeLabels[book.transactionType] || book.transactionType}
          </span>
          {book.transactionType === 'sale' && book.price != null && (
            <span className="text-wood font-semibold text-sm">
              ¥{book.price}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border-light">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{book.publishYear}年出版</span>
          {book.exchangeCategory && (
            <span>求换: {categoryLabels[book.exchangeCategory] || book.exchangeCategory}</span>
          )}
        </div>
      </div>

      <div className="mt-2">
        <p className="text-xs text-secondary line-clamp-2" title={book.description}>
          {book.description}
        </p>
      </div>

      <div className="review-card-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm flex-1"
          onClick={() => onApprove(book.id)}
        >
          通过
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm flex-1"
          onClick={() => onReject(book)}
        >
          拒绝
        </button>
      </div>
    </div>
  )
}

interface TransactionWithDetails extends Transaction {
  book?: Book
}

export default function Admin() {
  const navigate = useNavigate()
  const { user, addNotification } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('review')
  const [pendingBooks, setPendingBooks] = useState<Book[]>([])
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingBook, setRejectingBook] = useState<Book | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const isAdmin = user?.isAdmin ?? false

  const fetchPendingBooks = useCallback(async () => {
    try {
      const data = await getBooks({ status: 'pending' })
      setPendingBooks(data)
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : '获取待审核书籍失败')
    }
  }, [addNotification])

  const fetchTransactions = useCallback(async () => {
    try {
      const params: Record<string, string | number> = {
        sortBy: 'date',
        sortOrder,
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const data = await getTransactions(params)

      const bookIds = [...new Set(data.map(t => t.bookId))]

      const booksData = await Promise.all(
        bookIds.map(id => getBooks().then(books => books.find(b => b.id === id)))
      ).then(books => books.filter(Boolean) as Book[])

      const bookMap = new Map(booksData.map(b => [b.id, b]))

      const transactionsWithDetails: TransactionWithDetails[] = data.map(t => ({
        ...t,
        book: bookMap.get(t.bookId),
      }))

      setTransactions(transactionsWithDetails)
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : '获取交易记录失败')
    }
  }, [statusFilter, sortOrder, addNotification])

  useEffect(() => {
    if (!isAdmin) return

    const loadData = async () => {
      setLoading(true)
      if (activeTab === 'review') {
        await fetchPendingBooks()
      } else {
        await fetchTransactions()
      }
      setLoading(false)
    }

    loadData()
  }, [isAdmin, activeTab, fetchPendingBooks, fetchTransactions])

  const handleApprove = async (id: string) => {
    try {
      setRemovingIds(prev => new Set(prev).add(id))
      await reviewBook(id, { status: 'approved' })
      addNotification('success', '书籍审核通过')

      setTimeout(() => {
        setPendingBooks(prev => prev.filter(b => b.id !== id))
        setRemovingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 500)
    } catch (err) {
      setRemovingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      addNotification('error', err instanceof Error ? err.message : '审核失败')
    }
  }

  const handleRejectClick = (book: Book) => {
    setRejectingBook(book)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingBook) return
    if (!rejectReason.trim()) {
      addNotification('warning', '请输入拒绝原因')
      return
    }
    if (rejectReason.length > 50) {
      addNotification('warning', '拒绝原因不能超过50字')
      return
    }

    try {
      setRemovingIds(prev => new Set(prev).add(rejectingBook.id))
      await reviewBook(rejectingBook.id, {
        status: 'rejected',
        rejectReason: rejectReason.trim(),
      })
      addNotification('success', '书籍已拒绝')
      setRejectDialogOpen(false)

      setTimeout(() => {
        setPendingBooks(prev => prev.filter(b => b.id !== rejectingBook.id))
        setRemovingIds(prev => {
          const next = new Set(prev)
          next.delete(rejectingBook.id)
          return next
        })
        setRejectingBook(null)
        setRejectReason('')
      }, 500)
    } catch (err) {
      setRemovingIds(prev => {
        const next = new Set(prev)
        next.delete(rejectingBook.id)
        return next
      })
      addNotification('error', err instanceof Error ? err.message : '拒绝操作失败')
    }
  }

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAdmin) {
    return (
      <div className="no-permission">
        <div className="no-permission-card animate-card-unfold">
          <div className="no-permission-icon">🔒</div>
          <h2 className="no-permission-title">无权限访问</h2>
          <p className="no-permission-text">
            该页面仅对管理员开放。如需访问，请使用管理员账号登录，或联系系统管理员获取权限。
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="admin-page">
        <div className="container">
          <div className="admin-header animate-list-fade">
            <h1 className="admin-title">管理员后台</h1>
            <p className="admin-subtitle">管理书籍审核与交易记录</p>
          </div>

          <div className="tabs-container animate-list-fade" style={{ animationDelay: '0.1s' }}>
            <button
              type="button"
              className={cn('tab-item', activeTab === 'review' && 'active')}
              onClick={() => setActiveTab('review')}
            >
              书籍审核
              {pendingBooks.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-wood-primary text-wood-cream rounded-full">
                  {pendingBooks.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className={cn('tab-item', activeTab === 'transactions' && 'active')}
              onClick={() => setActiveTab('transactions')}
            >
              交易记录
            </button>
          </div>

          {activeTab === 'review' && (
            <div className="animate-list-fade" style={{ animationDelay: '0.15s' }}>
              {loading ? (
                <div className="grid-books">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <BookCardSkeleton key={i} />
                  ))}
                </div>
              ) : pendingBooks.length === 0 ? (
                <Empty
                  icon="📚"
                  title="暂无待审核书籍"
                  description="所有书籍都已完成审核，真棒！"
                />
              ) : (
                <div className="grid-books">
                  {pendingBooks.map((book, index) => (
                    <ReviewBookCard
                      key={book.id}
                      book={book}
                      index={index}
                      onApprove={handleApprove}
                      onReject={handleRejectClick}
                      isRemoving={removingIds.has(book.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-list-fade" style={{ animationDelay: '0.15s' }}>
              <div className="filter-bar-row">
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TransactionStatusFilter)}
                >
                  {Object.entries(statusFilterLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className={cn('sort-button', sortOrder === 'asc' && 'active')}
                  onClick={handleSortToggle}
                >
                  <span className={cn('sort-icon', sortOrder === 'asc' && 'asc')}>↓</span>
                  {sortOrder === 'desc' ? '最新优先' : '最早优先'}
                </button>
              </div>

              {loading ? (
                <div className="data-table">
                  <div className="data-table-empty">
                    <div className="spinner mx-auto mb-4" />
                    <p>加载中...</p>
                  </div>
                </div>
              ) : transactions.length === 0 ? (
                <Empty
                  icon="📋"
                  title="暂无交易记录"
                  description="当前筛选条件下没有交易记录"
                />
              ) : (
                <div className="data-table overflow-x-auto">
                  <table className="w-full">
                    <thead className="data-table-header">
                      <tr>
                        <th>交易时间</th>
                        <th>买方</th>
                        <th>卖方</th>
                        <th>书籍</th>
                        <th>交易类型</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody className="data-table-body">
                      {transactions.map((transaction, index) => (
                        <tr key={transaction.id} className="animate-list-fade" style={{ animationDelay: `${index * 0.05}s` }}>
                          <td className="whitespace-nowrap">{formatDate(transaction.createdAt)}</td>
                          <td>
                            <div className="user-cell">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${transaction.buyerId}`}
                                alt="买家头像"
                                className="user-avatar-small"
                              />
                              <span>用户 {transaction.buyerId.slice(0, 8)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="user-cell">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${transaction.sellerId}`}
                                alt="卖家头像"
                                className="user-avatar-small"
                              />
                              <span>用户 {transaction.sellerId.slice(0, 8)}</span>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="font-medium text-primary truncate max-w-[200px]" title={transaction.book?.title}>
                                {transaction.book?.title || '未知书籍'}
                              </div>
                              {transaction.price != null && (
                                <div className="text-sm text-wood">¥{transaction.price}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="tag text-xs">
                              {transactionTypeLabels[transaction.type] || transaction.type}
                            </span>
                          </td>
                          <td>
                            <span className={cn('status-badge', `status-${transaction.status}`)}>
                              {statusLabels[transaction.status] || transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false)
          setRejectingBook(null)
          setRejectReason('')
        }}
        title="拒绝书籍审核"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectingBook(null)
                setRejectReason('')
              }}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || rejectReason.length > 50}
            >
              确认拒绝
            </button>
          </>
        }
      >
        {rejectingBook && (
          <div>
            <p className="text-secondary mb-4">
              确定拒绝书籍 <span className="font-semibold text-primary">《{rejectingBook.title}》</span> 吗？
            </p>
            <textarea
              className="reject-input"
              placeholder="请输入拒绝原因（必填，最多50字）"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value.slice(0, 50))}
              maxLength={50}
              autoFocus
            />
            <p className={cn('char-count', rejectReason.length >= 45 && 'warning')}>
              {rejectReason.length}/50
            </p>
          </div>
        )}
      </Dialog>
    </div>
  )
}
