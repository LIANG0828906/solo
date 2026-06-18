import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Users, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLibraryStore } from '@/data/store'
import StarRating from './StarRating'
import ReviewCard from './ReviewCard'

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isReserving, setIsReserving] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [commentError, setCommentError] = useState('')

  const book = useLibraryStore((s) => s.getBookById(id || ''))
  const reviews = useLibraryStore((s) => s.getBookReviews(id || ''))
  const avgRating = useLibraryStore((s) => s.getBookAverageRating(id || ''))
  const isReservedByUser = useLibraryStore((s) => s.isBookReservedByUser(id || ''))
  const availableCopies = useLibraryStore((s) => s.getAvailableCopies(id || ''))
  const waitingCount = useLibraryStore((s) => s.getWaitingCount(id || ''))
  const createReservation = useLibraryStore((s) => s.createReservation)
  const addReview = useLibraryStore((s) => s.addReview)
  const currentUser = useLibraryStore((s) => s.currentUser)

  if (!book) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 flex flex-col items-center justify-center py-20 text-surface-400">
        <BookOpen className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">未找到该图书</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-primary-500 hover:text-primary-600 text-sm font-medium"
        >
          返回首页
        </button>
      </div>
    )
  }

  const handleReserve = () => {
    if (availableCopies <= 0 || isReservedByUser) return
    setIsReserving(true)
    setTimeout(() => {
      const result = createReservation(book.id)
      if (result) {
        toast.success('预约成功！', { duration: 3000 })
      } else {
        toast.error('预约失败，请稍后再试', { duration: 3000 })
      }
      setIsReserving(false)
    }, 200)
  }

  const handleSubmitReview = () => {
    if (reviewRating === 0) {
      toast.error('请选择评分', { duration: 3000 })
      return
    }
    if (reviewComment.length < 10) {
      setCommentError('评论至少需要10个字')
      return
    }
    if (reviewComment.length > 200) {
      setCommentError('评论不能超过200个字')
      return
    }
    setCommentError('')
    addReview(book.id, reviewRating, reviewComment)
    setReviewRating(0)
    setReviewComment('')
    toast.success('书评已发布！', { duration: 3000 })
  }

  const isBookAvailable = availableCopies > 0

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 pb-12">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-surface-500 hover:text-primary-500 mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        返回图书列表
      </button>

      <div className="bg-white rounded-card shadow-card border border-surface-100 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-72 lg:w-80 flex-shrink-0">
            <div className="aspect-[3/4] md:aspect-auto md:h-full bg-surface-100 relative overflow-hidden">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-surface-100 text-surface-400">
                <BookOpen className="w-16 h-16 mb-2" />
                <span className="text-sm">{book.category}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-block px-3 py-0.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full mb-3">
                  {book.category}
                </span>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-surface-900 mb-1">
                  {book.title}
                </h1>
                <p className="text-surface-500">{book.author}</p>
              </div>
              {avgRating > 0 && (
                <div className="flex items-center gap-1.5 bg-accent-50 px-3 py-1.5 rounded-full">
                  <span className="text-lg font-bold text-accent-600">{avgRating}</span>
                  <span className="text-xs text-accent-500">/5</span>
                </div>
              )}
            </div>

            <p className="text-surface-600 leading-relaxed mb-6">{book.description}</p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <BookOpen className="w-4 h-4 text-primary-400" />
                <span>馆藏 {book.totalCopies} 本</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <Users className="w-4 h-4 text-accent-400" />
                <span>可借 {availableCopies} 本</span>
              </div>
              {waitingCount > 0 && !isBookAvailable && (
                <div className="flex items-center gap-2 text-sm text-surface-500">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span>{waitingCount} 人排队等待</span>
                </div>
              )}
            </div>

            {isReservedByUser ? (
              <button
                disabled
                className="px-6 py-2.5 bg-surface-100 text-surface-400 rounded-xl text-sm font-medium cursor-not-allowed"
              >
                已预约
              </button>
            ) : !isBookAvailable ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="px-6 py-2.5 bg-surface-200 text-surface-400 rounded-xl text-sm font-medium cursor-not-allowed"
                >
                  暂无库存
                </button>
                <p className="text-xs text-red-400">
                  当前有 {waitingCount} 人排队等待，请耐心等候
                </p>
              </div>
            ) : (
              <button
                onClick={handleReserve}
                disabled={isReserving}
                className={`btn-ripple px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-all duration-200 ${
                  isReserving ? 'scale-95' : ''
                }`}
              >
                {isReserving ? '预约中...' : '立即预约'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-card shadow-card border border-surface-100 p-6 md:p-8 mb-6">
          <h2 className="font-serif text-lg font-bold text-surface-800 mb-4">发表书评</h2>
          <div className="mb-4">
            <label className="block text-sm text-surface-600 mb-2">评分</label>
            <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-surface-600 mb-2">
              评论 <span className="text-surface-400">（10-200字）</span>
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => {
                setReviewComment(e.target.value)
                if (commentError) setCommentError('')
              }}
              placeholder="分享你的阅读感受..."
              rows={4}
              className={`w-full px-4 py-3 bg-surface-50 border rounded-xl text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all resize-none ${
                commentError ? 'border-red-300' : 'border-surface-200'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {commentError && <span className="text-xs text-red-400">{commentError}</span>}
              <span className={`text-xs ml-auto ${reviewComment.length > 200 ? 'text-red-400' : 'text-surface-400'}`}>
                {reviewComment.length}/200
              </span>
            </div>
          </div>
          <button
            onClick={handleSubmitReview}
            className="btn-ripple px-6 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            提交书评
          </button>
        </div>

        <div>
          <h2 className="font-serif text-lg font-bold text-surface-800 mb-4">
            读者书评 ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-surface-400">
              <p className="text-sm">暂无书评，快来第一个发表吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, idx) => (
                <ReviewCard
                  key={review.id}
                  userName={review.userName}
                  rating={review.rating}
                  comment={review.comment}
                  createdAt={review.createdAt}
                  isNew={idx === 0 && review.userId === currentUser.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
