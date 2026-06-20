import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, BookOpen, Calendar, Tag, ShoppingCart, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBookById, getUserBooks, createTransaction, type Book } from '@/api'
import { useAppStore } from '@/store'
import { ConfirmDialog } from '@/components/Dialog'
import Empty from '@/components/Empty'

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

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, addNotification } = useAppStore()

  const [book, setBook] = useState<Book | null>(null)
  const [ownerBooks, setOwnerBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const bookData = await getBookById(id)
        setBook(bookData)

        if (bookData.ownerId) {
          const booksData = await getUserBooks(bookData.ownerId)
          setOwnerBooks(booksData.filter(b => b.id !== id && b.status === 'approved'))
        }
      } catch (err) {
        addNotification('error', err instanceof Error ? err.message : '获取书籍详情失败')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, addNotification])

  const handleBack = () => {
    navigate(-1)
  }

  const handleActionClick = () => {
    if (!user) {
      addNotification('warning', '请先登录后再进行操作')
      return
    }
    if (!book) return
    if (user.id === book.ownerId) {
      addNotification('info', '不能与自己进行交易')
      return
    }
    setDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!book || !user) return

    try {
      setSubmitting(true)
      await createTransaction({
        bookId: book.id,
        type: book.transactionType,
        price: book.price,
      })
      addNotification('success', book.transactionType === 'exchange' ? '交换申请已提交' : '购买请求已提交')
      setDialogOpen(false)
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : '操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBookClick = (bookId: string) => {
    navigate(`/books/${bookId}`)
  }

  if (loading) {
    return (
      <div className="detail-panel animate-slide-in-right">
        <div className="p-6">
          <div className="h-8 w-8 bg-border-light rounded animate-pulse mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="max-w-[400px] mx-auto w-full">
              <div className="aspect-[3/4] bg-border-light rounded-2xl animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-border-light rounded animate-pulse" />
              <div className="h-5 w-1/2 bg-border-light rounded animate-pulse" />
              <div className="h-5 w-1/3 bg-border-light rounded animate-pulse" />
              <div className="h-6 w-20 bg-border-light rounded-full animate-pulse" />
              <div className="h-24 w-full bg-border-light rounded animate-pulse" />
              <div className="h-12 w-full bg-border-light rounded-xl animate-pulse mt-6" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="detail-panel animate-slide-in-right">
        <div className="p-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <Empty message="书籍不存在或已被下架" />
        </div>
      </div>
    )
  }

  const isOwner = user?.id === book.ownerId
  const isExchange = book.transactionType === 'exchange'

  return (
    <div className="detail-panel animate-slide-in-right">
      <div className="p-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="max-w-[400px] mx-auto w-full">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-wood-secondary to-wood-primary">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-wood-cream/60 text-6xl font-serif">
                  {book.title?.charAt(0) || '书'}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-2">
              {book.title}
            </h1>

            <div className="flex items-center gap-2 mb-1 text-secondary">
              <User className="w-4 h-4" />
              <span>{book.author}</span>
            </div>

            <div className="flex items-center gap-2 mb-4 text-secondary">
              <Calendar className="w-4 h-4" />
              <span>{book.publishYear}年出版</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="tag">
                <Tag className="w-3 h-3 mr-1" />
                {categoryLabels[book.category] || book.category}
              </span>
              <span className={cn(
                'tag',
                isExchange ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              )}>
                {isExchange ? <RefreshCw className="w-3 h-3 mr-1" /> : <ShoppingCart className="w-3 h-3 mr-1" />}
                {transactionTypeLabels[book.transactionType]}
              </span>
              {book.exchangeCategory && (
                <span className="tag bg-amber-100 text-amber-700">
                  求换: {categoryLabels[book.exchangeCategory] || book.exchangeCategory}
                </span>
              )}
              {!isExchange && book.price != null && (
                <span className="tag bg-wood-primary text-wood-cream">
                  ¥{book.price}
                </span>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-serif font-semibold text-primary mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                书籍简介
              </h3>
              <p className="text-secondary leading-relaxed">
                {book.description || '暂无简介'}
              </p>
            </div>

            <div className="flex-1" />

            <div className="p-4 bg-secondary rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-wood-secondary flex items-center justify-center text-wood-dark font-medium text-lg">
                  {book.ownerId?.charAt(0) || '用'}
                </div>
                <div>
                  <div className="font-medium text-primary">书籍发布者</div>
                  <div className="text-sm text-secondary">用户 {book.ownerId?.slice(0, 8)}</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className={cn(
                'btn btn-lg w-full gap-2',
                isExchange ? 'btn-secondary' : 'btn-primary',
                isOwner && 'opacity-50 cursor-not-allowed'
              )}
              onClick={handleActionClick}
              disabled={isOwner || submitting}
            >
              {isOwner ? (
                '这是你发布的书籍'
              ) : isExchange ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  申请交换
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  立即购买 ¥{book.price}
                </>
              )}
            </button>
          </div>
        </div>

        {ownerBooks.length > 0 && (
          <div className="mt-8">
            <h3 className="font-serif font-semibold text-primary mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              TA的其他在售书籍
            </h3>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                {ownerBooks.map((ownerBook, index) => (
                  <Link
                    key={ownerBook.id}
                    to={`/books/${ownerBook.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      handleBookClick(ownerBook.id)
                    }}
                    className={cn(
                      'flex-shrink-0 w-36 cursor-pointer group',
                      `animate-list-fade stagger-${Math.min(index % 8 + 1, 8)}`
                    )}
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-sm mb-2 bg-gradient-to-br from-wood-secondary to-wood-primary group-hover:shadow-md transition-shadow">
                      {ownerBook.coverUrl ? (
                        <img
                          src={ownerBook.coverUrl}
                          alt={ownerBook.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-wood-cream/60 text-2xl font-serif">
                          {ownerBook.title?.charAt(0) || '书'}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-primary truncate-1 group-hover:text-wood transition-colors">
                      {ownerBook.title}
                    </div>
                    <div className="text-xs text-muted">
                      {ownerBook.author}
                    </div>
                    <div className="text-xs text-wood font-medium mt-1">
                      {ownerBook.transactionType === 'exchange'
                        ? '交换'
                        : `¥${ownerBook.price}`}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirm}
        title={isExchange ? '确认申请交换' : '确认购买'}
        message={
          isExchange
            ? `你确定要申请交换《${book.title}》吗？提交后发布者将收到你的交换请求。`
            : `你确定要购买《${book.title}》吗？价格为 ¥${book.price}，提交后将进入交易流程。`
        }
        confirmText={isExchange ? '确认交换' : '确认购买'}
        confirmVariant={isExchange ? 'secondary' : 'primary'}
      />
    </div>
  )
}
