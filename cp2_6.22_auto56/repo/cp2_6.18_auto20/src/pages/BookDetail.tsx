import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Star, TrendingUp, ArrowLeft, Send } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '@/store'
import StarRating from '@/components/StarRating'
import { formatTime } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { Comment, User } from '@/types'

const mockUsers: User[] = [
  { id: 'user-1', name: '读书爱好者', avatar: '📚' },
  { id: 'user-2', name: '星际旅人', avatar: '🚀' },
  { id: 'user-3', name: '诗词墨客', avatar: '✍️' },
  { id: 'user-4', name: '历史探索者', avatar: '🏛️' },
]

function getUserName(userId: string): string {
  const user = mockUsers.find((u) => u.id === userId)
  return user?.name || '匿名用户'
}

function getUserAvatar(userId: string): string {
  const user = mockUsers.find((u) => u.id === userId)
  return user?.avatar || '📖'
}

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const rankedBookLists = useStore((state) => state.rankedBookLists)
  const comments = useStore((state) => state.comments)
  const toggleLike = useStore((state) => state.toggleLike)
  const addRating = useStore((state) => state.addRating)
  const addComment = useStore((state) => state.addComment)

  const bookList = useMemo(() => rankedBookLists.find((b) => b.id === id), [rankedBookLists, id])

  const bookComments = useMemo(
    () => comments.filter((c) => c.bookListId === id).sort((a, b) => b.createdAt - a.createdAt),
    [comments, id]
  )

  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(bookList?.userRating as 1 | 2 | 3 | 4 | 5 || 5)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const heatTrendData = useMemo(() => {
    const baseScore = bookList?.hotScore || 0
    return Array.from({ length: 7 }, (_, i) => {
      const dayOffset = 6 - i
      const variation = (Math.sin(dayOffset * 0.8) + 1) * 0.2
      return {
        name: `${dayOffset}天前`,
        热度: Math.max(0, baseScore * (0.6 + variation + dayOffset * 0.05)),
      }
    }).reverse()
  }, [bookList?.hotScore])

  const handleLike = () => {
    if (!bookList) return
    toggleLike(bookList.id)
  }

  const handleRatingSubmit = () => {
    if (!bookList) return
    addRating(bookList.id, rating)
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookList || !commentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    addComment(bookList.id, commentText.trim())
    setCommentText('')
    setTimeout(() => setIsSubmitting(false), 300)
  }

  if (!bookList) {
    return (
      <div className="min-h-screen bg-mainBg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">书单不存在</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mainBg">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首页</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {bookList.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-4">
            {bookList.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm font-medium bg-amber-50 text-amber-700 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{bookList.description}</p>

          <div className="text-sm text-gray-500 mb-6">
            创建于 {new Date(bookList.createdAt).toLocaleDateString('zh-CN')}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-2xl font-bold">{bookList.averageRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-500">平均评分</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <MessageCircle className="w-5 h-5" />
                <span className="text-2xl font-bold">{bookList.commentCount}</span>
              </div>
              <p className="text-sm text-gray-500">评论数</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center justify-center gap-1 mb-1 transition-all',
                  bookList.userHasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                )}
              >
                <Heart className={cn('w-5 h-5', bookList.userHasLiked && 'fill-current')} />
                <span className="text-2xl font-bold">{bookList.likeCount}</span>
              </button>
              <p className="text-sm text-gray-500">点赞数</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-2xl font-bold">{bookList.hotScore.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-500">热度值</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              热度趋势
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={heatTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="热度"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#F59E0B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              评分
            </h2>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <button
                onClick={handleRatingSubmit}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                提交评分
              </button>
              {bookList.userRating && (
                <span className="text-sm text-gray-500">
                  已评分：{bookList.userRating} 星
                </span>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              发表评论
            </h2>
            <form onSubmit={handleCommentSubmit}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="分享你的看法..."
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  className={cn(
                    'text-sm',
                    commentText.length > 180 ? 'text-amber-600' : 'text-gray-400'
                  )}
                >
                  {commentText.length}/200
                </span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>发送</span>
                </button>
              </div>
            </form>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              评论列表 ({bookComments.length})
            </h2>
            {bookComments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暂无评论，快来抢沙发吧！</p>
            ) : (
              <div className="space-y-4">
                {bookComments.map((comment: Comment, index: number) => (
                  <div
                    key={comment.id}
                    className="animate-fadeIn p-4 bg-gray-50 rounded-xl"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                        {getUserAvatar(comment.userId)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {getUserName(comment.userId)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
