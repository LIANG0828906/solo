import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { Heart, Flag, User, Clock } from 'lucide-react'
import StarRating from '@/components/StarRating'
import { Review } from '@/types'
import { cn } from '@/lib/utils'

interface CommentListProps {
  communityId?: string
}

export default function CommentList({ communityId }: CommentListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null)
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const url = communityId
        ? `/api/reviews?communityId=${communityId}`
        : '/api/reviews'
      const response = await axios.get<Review[]>(url)
      const sortedReviews = response.data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setReviews(sortedReviews)
    } catch (err) {
      setError('加载评价失败，请稍后重试')
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [communityId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            if (src) {
              img.src = src
              img.classList.add('opacity-100')
              img.classList.remove('opacity-0')
              observerRef.current?.unobserve(img)
            }
          }
        })
      },
      { rootMargin: '100px' }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [reviews])

  const handleImageRef = useCallback((id: string, img: HTMLImageElement | null) => {
    if (img) {
      imageRefs.current.set(id, img)
      observerRef.current?.observe(img)
    } else {
      const existingImg = imageRefs.current.get(id)
      if (existingImg) {
        observerRef.current?.unobserve(existingImg)
      }
      imageRefs.current.delete(id)
    }
  }, [])

  const handleLike = async (reviewId: string) => {
    const isLiked = likedReviews.has(reviewId)
    
    try {
      await axios.post(`/api/reviews/${reviewId}/like`)
      
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? { ...review, likes: isLiked ? review.likes - 1 : review.likes + 1 }
            : review
        )
      )
      
      setLikedReviews((prev) => {
        const next = new Set(prev)
        if (isLiked) {
          next.delete(reviewId)
        } else {
          next.add(reviewId)
        }
        return next
      })
    } catch (err) {
      console.error('Failed to like review:', err)
    }
  }

  const handleReportClick = (reviewId: string) => {
    setReportingReviewId(reviewId)
    setReportDialogOpen(true)
  }

  const handleReportConfirm = async () => {
    if (!reportingReviewId) return
    
    try {
      await axios.post(`/api/reviews/${reportingReviewId}/report`)
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reportingReviewId ? { ...review, reported: true } : review
        )
      )
    } catch (err) {
      console.error('Failed to report review:', err)
    } finally {
      setReportDialogOpen(false)
      setReportingReviewId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-6 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p className="mb-4">{error}</p>
        <button
          onClick={fetchReviews}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          重新加载
        </button>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>暂无评价</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, index) => {
        const isLiked = likedReviews.has(review.id)
        return (
          <div
            key={review.id}
            className={cn(
              'rounded-2xl bg-white p-6 shadow-sm',
              'hover:shadow-md transition-shadow duration-300'
            )}
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                <User size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{review.username}</p>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock size={14} />
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">生活便利</span>
                <StarRating value={review.scores.life} readOnly size={16} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">交通出行</span>
                <StarRating value={review.scores.transport} readOnly size={16} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">安静程度</span>
                <StarRating value={review.scores.quiet} readOnly size={16} />
              </div>
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-4">
                {review.images.slice(0, 3).map((img, imgIndex) => (
                  <div key={imgIndex} className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      ref={(el) => handleImageRef(`${review.id}-${imgIndex}`, el)}
                      data-src={img}
                      alt={`评价图片 ${imgIndex + 1}`}
                      className={cn(
                        'w-full h-full object-cover',
                        'transition-opacity duration-500 ease-in-out',
                        'opacity-0'
                      )}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleLike(review.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'transition-all duration-200 ease-out',
                  'hover:scale-105 active:scale-95',
                  isLiked
                    ? 'text-red-500 bg-red-50'
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                )}
              >
                <Heart
                  size={18}
                  className={cn(
                    'transition-transform duration-200',
                    isLiked && 'fill-current scale-110'
                  )}
                />
                <span className="text-sm font-medium">{review.likes}</span>
              </button>

              <button
                onClick={() => handleReportClick(review.id)}
                disabled={review.reported}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'transition-colors duration-200',
                  review.reported
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
                )}
              >
                <Flag size={18} />
                <span className="text-sm">
                  {review.reported ? '已举报' : '举报'}
                </span>
              </button>
            </div>
          </div>
        )
      })}

      {reportDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认举报</h3>
            <p className="text-gray-600 mb-6">确定要举报这条评价吗？举报后将由管理员审核处理。</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReportDialogOpen(false)
                  setReportingReviewId(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReportConfirm}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                确认举报
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
