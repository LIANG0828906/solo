import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import BookCard from '@/components/BookCard'

interface Book {
  id: string
  title: string
  author: string
  isbn: string
  publishYear: number
  description: string
  coverUrl: string
  dropPointId: string
  ownerId: string
  status: 'available' | 'borrowed'
  currentBorrowerId: string | null
  borrowCount: number
  totalRating: number
  ratingCount: number
  avgRating: number
}

interface DriftLog {
  id: string
  bookId: string
  userId: string
  username: string
  content: string
  rating: number
  createdAt: string
}

interface DropPoint {
  id: string
  name: string
  address: string
}

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [book, setBook] = useState<Book | null>(null)
  const [logs, setLogs] = useState<DriftLog[]>([])
  const [dropPoint, setDropPoint] = useState<DropPoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logContent, setLogContent] = useState('')
  const [logRating, setLogRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  const fetchBook = useCallback(async () => {
    if (!id) return

    try {
      const res = await axios.get(`/api/books/${id}`)
      setBook(res.data.book)
      setLogs(res.data.logs)

      const pointsRes = await axios.get('/api/drop-points')
      const point = pointsRes.data.points.find(
        (p: DropPoint) => p.id === res.data.book.dropPointId
      )
      setDropPoint(point || null)
    } catch (error) {
      console.error('Failed to fetch book:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBook()
  }, [fetchBook])

  const handleBorrow = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!book) return

    try {
      await axios.post(`/api/books/${book.id}/borrow`)
      setShowLogForm(true)
      navigate(`/chat/${book.ownerId}`)
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        alert(error.response?.data?.error || '申请借阅失败')
      }
    }
  }

  const handleReturn = async () => {
    if (!user || !book) return

    try {
      await axios.post(`/api/books/${book.id}/return`)
      setShowLogForm(true)
      alert('图书已归还，欢迎撰写漂流心得！')
      fetchBook()
    } catch (error: any) {
      alert(error.response?.data?.error || '归还失败')
    }
  }

  const handleSubmitLog = async () => {
    if (!user || !book) return

    if (logContent.length < 50) {
      alert('漂流心得至少需要50字')
      return
    }

    setSubmitting(true)

    try {
      await axios.post(`/api/books/${book.id}/logs`, {
        content: logContent,
        rating: logRating,
      })

      alert('心得发布成功！')
      setLogContent('')
      setLogRating(5)
      setShowLogForm(false)
      fetchBook()
    } catch (error: any) {
      alert(error.response?.data?.error || '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => interactive && onChange && onChange(i + 1)}
            className={`text-2xl transition-transform ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
              i < rating ? 'text-amber-400' : 'text-gray-300'
            }`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-brown font-serif text-xl">加载中...</div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <div className="text-brown font-serif text-xl mb-4">图书不存在</div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-brown text-cream rounded-lg hover:bg-brown-dark transition-colors"
        >
          返回地图
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-brown hover:text-brown-dark transition-colors"
          >
            ← 返回地图
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(92, 64, 51, 0.15)',
              }}
            >
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="p-4 space-y-4">
                <div
                  className="rounded-xl p-4 bg-cream-dark/50"
                  style={{
                    background: 'linear-gradient(135deg, #F5F0E8 0%, #FAF7F2 100%)',
                  }}
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold text-brown mb-1">
                      {book.avgRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mb-2">
                      {renderStars(Math.round(book.avgRating))}
                    </div>
                    <p className="text-xs text-brown-light">
                      {book.ratingCount} 人评价
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-brown/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brown">{book.borrowCount}</div>
                      <div className="text-xs text-brown-light">被借阅次数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brown">
                        {book.status === 'available' ? '可借' : '已借'}
                      </div>
                      <div className="text-xs text-brown-light">当前状态</div>
                    </div>
                  </div>
                </div>

                {book.status === 'available' && user && book.ownerId !== user.id && (
                  <button
                    onClick={handleBorrow}
                    className="w-full py-3 bg-brown text-cream rounded-xl font-medium hover:bg-brown-dark transition-colors"
                  >
                    申请借阅
                  </button>
                )}

                {book.status === 'borrowed' && user && book.currentBorrowerId === user.id && (
                  <button
                    onClick={handleReturn}
                    className="w-full py-3 bg-marker-blue text-cream rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    归还图书
                  </button>
                )}

                {user && book.ownerId !== user.id && (
                  <button
                    onClick={() => setShowLogForm(!showLogForm)}
                    className="w-full py-3 border border-brown text-brown rounded-xl font-medium hover:bg-brown hover:text-cream transition-colors"
                  >
                    撰写漂流心得
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(92, 64, 51, 0.1)',
              }}
            >
              <h1 className="font-serif font-bold text-3xl text-brown mb-2">
                {book.title}
              </h1>
              <p className="text-brown-light mb-4">{book.author} 著</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                {book.isbn && (
                  <div>
                    <span className="text-brown-light">ISBN：</span>
                    <span className="text-brown">{book.isbn}</span>
                  </div>
                )}
                {book.publishYear > 0 && (
                  <div>
                    <span className="text-brown-light">出版年份：</span>
                    <span className="text-brown">{book.publishYear}</span>
                  </div>
                )}
                {dropPoint && (
                  <div className="col-span-2">
                    <span className="text-brown-light">漂流点：</span>
                    <span className="text-brown">{dropPoint.name}</span>
                  </div>
                )}
              </div>

              {book.description && (
                <div>
                  <h3 className="font-serif font-semibold text-brown mb-2">内容简介</h3>
                  <p className="text-brown/80 leading-relaxed">{book.description}</p>
                </div>
              )}
            </div>

            {showLogForm && user && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(92, 64, 51, 0.15)',
                }}
              >
                <h3 className="font-serif font-semibold text-brown text-lg mb-4">
                  撰写漂流心得
                </h3>

                <div className="mb-4">
                  <label className="block text-brown font-medium mb-2">评分</label>
                  {renderStars(logRating, true, setLogRating)}
                </div>

                <div className="mb-4">
                  <label className="block text-brown font-medium mb-2">
                    漂流心得（至少50字）
                  </label>
                  <textarea
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    placeholder="分享你的阅读感受、这本书带给你的思考、或者你希望下一位读者注意什么..."
                    rows={5}
                    className="w-full px-4 py-3 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors resize-none"
                  />
                  <p className="text-xs text-brown-light mt-1">
                    已输入 {logContent.length} 字
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitLog}
                    disabled={submitting || logContent.length < 50}
                    className="flex-1 py-2.5 bg-brown text-cream rounded-xl font-medium hover:bg-brown-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '发布中...' : '发布心得'}
                  </button>
                  <button
                    onClick={() => setShowLogForm(false)}
                    className="px-6 py-2.5 border border-brown/30 text-brown rounded-xl hover:bg-brown/5 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div>
              <h2 className="font-serif font-bold text-xl text-brown mb-4">
                📜 漂流日志
              </h2>

              {logs.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p className="text-brown-light">暂无漂流心得</p>
                  <p className="text-sm text-brown-light/70 mt-1">
                    成为第一位分享阅读感受的人吧
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl p-5 transition-all duration-300 hover:shadow-md"
                      style={{
                        background: 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 16px rgba(92, 64, 51, 0.08)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="font-medium text-brown">
                            {log.username}
                          </span>
                          <span className="text-xs text-brown-light ml-2">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < log.rating ? 'text-amber-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-brown/80 leading-relaxed whitespace-pre-wrap">
                        {log.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetailPage
