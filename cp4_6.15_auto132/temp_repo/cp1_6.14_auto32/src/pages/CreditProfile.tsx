import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import CommentItem from '@/components/CommentItem'
import EmptyState from '@/components/EmptyState'

export default function CreditProfile() {
  const { userId } = useParams<{ userId: string }>()
  const [avgScore, setAvgScore] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [ratings, setRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRatings = useCallback(async () => {
    if (!userId) return
    try {
      const res = await axios.get(`/api/exchange/ratings/${userId}`)
      setAvgScore(res.data.averageScore || 0)
      setTotalCount(res.data.totalCount || 0)
      setRatings(res.data.ratings || [])
    } catch {
      setRatings([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchRatings()
  }, [fetchRatings])

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-200" />
          <div className="mx-auto h-8 w-32 rounded bg-gray-200" />
          <div className="mx-auto h-4 w-20 rounded bg-gray-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 animate-fade-in">
      <div className="mb-8 flex flex-col items-center rounded-2xl bg-white p-8 shadow-card">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary">
          {avgScore > 0 ? avgScore.toFixed(1) : '-'}
        </div>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'h-6 w-6',
                i < Math.round(avgScore)
                  ? 'fill-primary text-primary'
                  : 'fill-none text-gray-300'
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          共 {totalCount} 条评价
        </p>
      </div>

      {ratings.length === 0 ? (
        <EmptyState message="暂无评价记录" />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500">评价列表</h2>
          {ratings.map((rating: any, idx: number) => (
            <div
              key={rating.id || idx}
              className="comment-slide-in"
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
            >
              <CommentItem rating={rating} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
