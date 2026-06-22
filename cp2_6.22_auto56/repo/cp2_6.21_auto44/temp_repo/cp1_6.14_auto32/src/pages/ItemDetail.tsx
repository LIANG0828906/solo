import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Star, Repeat, Tag, Clock, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryLabels, conditionLabels, statusConfig, formatTime } from '@/lib/utils'
import { useAppStore } from '@/store'
import ImageCarousel from '@/components/ImageCarousel'
import CommentItem from '@/components/CommentItem'
import ExchangeModal from '@/components/ExchangeModal'
import EmptyState from '@/components/EmptyState'

interface ItemData {
  id: string
  title: string
  category: string
  condition: string
  description: string
  images: string[]
  userId: string
  userName: string
  userAvatar: string
  status: 'available' | 'exchanged' | 'offline'
  createdAt: number
}

interface RatingData {
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  score: number
  comment: string
  createdAt: number
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAppStore()

  const [item, setItem] = useState<ItemData | null>(null)
  const [ratings, setRatings] = useState<RatingData[]>([])
  const [avgScore, setAvgScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showExchangeModal, setShowExchangeModal] = useState(false)

  const fetchItem = useCallback(async () => {
    if (!id) return
    try {
      const res = await axios.get(`/api/items/${id}`)
      setItem(res.data)
      if (res.data.userId) {
        const ratingRes = await axios.get(`/api/exchange/ratings/${res.data.userId}`)
        setRatings(ratingRes.data.ratings || [])
        setAvgScore(ratingRes.data.averageScore || 0)
      }
    } catch {
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  const handleExchange = async (message: string) => {
    if (!item) return
    try {
      await axios.post('/api/exchange', {
        itemId: item.id,
        message,
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        requesterAvatar: currentUser.avatar,
      })
      setShowExchangeModal(false)
      alert('交换请求已发送！')
    } catch (err: any) {
      alert(err.response?.data?.error || '发送请求失败')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-24 rounded bg-gray-200" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-[4/3] rounded-xl bg-gray-200" />
            <div className="space-y-3">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-6 w-1/3 rounded bg-gray-200" />
              <div className="h-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyState message="物品不存在或已被删除" />
      </div>
    )
  }

  const status = statusConfig[item.status] || statusConfig.available
  const isOwner = item.userId === currentUser.id
  const canExchange = item.status === 'available' && !isOwner

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {item.images.length > 0 ? (
            <ImageCarousel images={item.images} />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              暂无图片
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
              <span
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white',
                  status.color
                )}
              >
                {status.label}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              <Tag className="h-3 w-3" />
              {categoryLabels[item.category] || item.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {conditionLabels[item.condition] || item.condition}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatTime(item.createdAt)}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
            {item.description}
          </p>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                {item.userAvatar ? (
                  <img src={item.userAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.userName}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="text-xs text-gray-500">{avgScore > 0 ? avgScore : '暂无评分'}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => canExchange && setShowExchangeModal(true)}
            disabled={!canExchange}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors',
              canExchange
                ? 'bg-primary text-white hover:bg-primary-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Repeat className="h-4 w-4" />
            {isOwner ? '这是您发布的物品' : item.status !== 'available' ? '物品不可交换' : '发起交换请求'}
          </button>
        </div>
      </div>

      {ratings.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">发布者评价</h2>
          <div className="space-y-3">
            {ratings.map((rating, idx) => (
              <div
                key={idx}
                className="comment-slide-in"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
              >
                <CommentItem rating={rating} />
              </div>
            ))}
          </div>
        </div>
      )}

      <ExchangeModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        onSubmit={handleExchange}
        itemTitle={item.title}
      />
    </div>
  )
}
