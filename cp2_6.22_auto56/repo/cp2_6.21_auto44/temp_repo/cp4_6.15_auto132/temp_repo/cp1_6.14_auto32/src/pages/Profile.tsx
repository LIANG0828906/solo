import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Package, Inbox, Send, Star, Trash2, Check, X as XIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryLabels, conditionLabels, statusConfig, formatTime } from '@/lib/utils'
import { useAppStore } from '@/store'
import RatingModal from '@/components/RatingModal'
import EmptyState from '@/components/EmptyState'

type TabKey = 'items' | 'received' | 'sent'

interface ExchangeData {
  id: string
  itemId: string
  itemTitle: string
  itemImage: string
  requesterId: string
  requesterName: string
  requesterAvatar: string
  ownerId: string
  ownerName: string
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | 'expired'
  createdAt: number
  acceptedAt: number | null
  completedAt: number | null
  requesterRated: boolean
  ownerRated: boolean
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: '待确认', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-500' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
}

const tabs: { key: TabKey; label: string; icon: typeof Package }[] = [
  { key: 'items', label: '我的物品', icon: Package },
  { key: 'received', label: '收到的请求', icon: Inbox },
  { key: 'sent', label: '发起的请求', icon: Send },
]

export default function Profile() {
  const { currentUser } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabKey>('items')
  const [myItems, setMyItems] = useState<any[]>([])
  const [received, setReceived] = useState<ExchangeData[]>([])
  const [sent, setSent] = useState<ExchangeData[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean
    exchangeId: string
    toUserId: string
    toUserName: string
  }>({ isOpen: false, exchangeId: '', toUserId: '', toUserName: '' })

  const fetchMyItems = useCallback(async () => {
    try {
      const res = await axios.get('/api/items')
      const all = res.data
      setMyItems(all.filter((i: any) => i.userId === currentUser.id))
    } catch {
      setMyItems([])
    }
  }, [currentUser.id])

  const fetchExchanges = useCallback(async () => {
    try {
      const res = await axios.get(`/api/exchange/${currentUser.id}`)
      setReceived(res.data.received || [])
      setSent(res.data.sent || [])
    } catch {
      setReceived([])
      setSent([])
    }
  }, [currentUser.id])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchMyItems(), fetchExchanges()]).finally(() => setLoading(false))
  }, [fetchMyItems, fetchExchanges])

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('确定删除这个物品吗？')) return
    try {
      await axios.delete(`/api/items/${itemId}`)
      setMyItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch {
      alert('删除失败')
    }
  }

  const handleAction = async (exchangeId: string, action: 'accept' | 'reject' | 'complete') => {
    try {
      await axios.post(`/api/exchange/${exchangeId}/action`, { action })
      await fetchExchanges()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleRate = async (score: number, comment: string) => {
    const { exchangeId, toUserId, toUserName } = ratingModal
    try {
      await axios.post(`/api/exchange/${exchangeId}/rate`, {
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        fromUserAvatar: currentUser.avatar,
        toUserId,
        score,
        comment,
      })
      setRatingModal({ isOpen: false, exchangeId: '', toUserId: '', toUserName: '' })
      await fetchExchanges()
    } catch (err: any) {
      alert(err.response?.data?.error || '评价失败')
    }
  }

  const getTimeRemaining = (acceptedAt: number | null) => {
    if (!acceptedAt) return null
    const elapsed = Date.now() - acceptedAt
    const remaining = 86400000 - elapsed
    if (remaining <= 0) return '已超时'
    const hours = Math.floor(remaining / 3600000)
    const minutes = Math.floor((remaining % 3600000) / 60000)
    return `${hours}小时${minutes}分钟`
  }

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <h1 className="mb-6 text-xl font-bold text-gray-900">个人中心</h1>

      <div className="mb-6 flex border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'items' && (
            <>
              {myItems.length === 0 ? (
                <EmptyState message="您还没有发布物品" />
              ) : (
                <div className="space-y-3">
                  {myItems.map((item: any) => {
                    const s = statusConfig[item.status] || statusConfig.available
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-card"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={cn('rounded-full px-2 py-0.5 text-xs text-white', s.color)}>
                              {s.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {categoryLabels[item.category] || item.category}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'received' && (
            <>
              {received.length === 0 ? (
                <EmptyState message="暂无收到的交换请求" />
              ) : (
                <div className="space-y-3">
                  {received.map((ex) => {
                    const st = statusLabels[ex.status] || statusLabels.pending
                    return (
                      <div key={ex.id} className="rounded-xl bg-white p-4 shadow-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{ex.itemTitle}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              来自 <span className="font-medium">{ex.requesterName}</span>
                            </p>
                            {ex.message && (
                              <p className="mt-1 text-xs text-gray-400 italic">"{ex.message}"</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', st.color)}>
                                {st.label}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatTime(ex.createdAt)}
                              </span>
                            </div>
                          </div>
                          {ex.status === 'pending' && (
                            <div className="flex shrink-0 gap-2">
                              <button
                                onClick={() => handleAction(ex.id, 'accept')}
                                className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> 接受
                              </button>
                              <button
                                onClick={() => handleAction(ex.id, 'reject')}
                                className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <XIcon className="h-3.5 w-3.5" /> 拒绝
                              </button>
                            </div>
                          )}
                          {ex.status === 'accepted' && (
                            <div className="shrink-0 space-y-2 text-right">
                              <div className="flex items-center gap-1 text-xs text-blue-500">
                                <Clock className="h-3 w-3" />
                                剩余 {getTimeRemaining(ex.acceptedAt)}
                              </div>
                              <button
                                onClick={() => handleAction(ex.id, 'complete')}
                                className="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> 确认完成
                              </button>
                            </div>
                          )}
                          {ex.status === 'completed' && !ex.ownerRated && (
                            <button
                              onClick={() =>
                                setRatingModal({
                                  isOpen: true,
                                  exchangeId: ex.id,
                                  toUserId: ex.requesterId,
                                  toUserName: ex.requesterName,
                                })
                              }
                              className="flex shrink-0 items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors"
                            >
                              <Star className="h-3.5 w-3.5" /> 评价
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'sent' && (
            <>
              {sent.length === 0 ? (
                <EmptyState message="暂无发起的交换请求" />
              ) : (
                <div className="space-y-3">
                  {sent.map((ex) => {
                    const st = statusLabels[ex.status] || statusLabels.pending
                    return (
                      <div key={ex.id} className="rounded-xl bg-white p-4 shadow-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{ex.itemTitle}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              向 <span className="font-medium">{ex.ownerName}</span> 发起
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', st.color)}>
                                {st.label}
                              </span>
                              {ex.status === 'accepted' && (
                                <span className="flex items-center gap-1 text-xs text-blue-500">
                                  <Clock className="h-3 w-3" />
                                  剩余 {getTimeRemaining(ex.acceptedAt)}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {formatTime(ex.createdAt)}
                              </span>
                            </div>
                          </div>
                          {ex.status === 'accepted' && (
                            <button
                              onClick={() => handleAction(ex.id, 'complete')}
                              className="flex shrink-0 items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" /> 确认完成
                            </button>
                          )}
                          {ex.status === 'completed' && !ex.requesterRated && (
                            <button
                              onClick={() =>
                                setRatingModal({
                                  isOpen: true,
                                  exchangeId: ex.id,
                                  toUserId: ex.ownerId,
                                  toUserName: ex.ownerName,
                                })
                              }
                              className="flex shrink-0 items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors"
                            >
                              <Star className="h-3.5 w-3.5" /> 评价
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <Link
          to={`/profile/${currentUser.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-600 transition-colors"
        >
          <Star className="h-4 w-4" />
          查看我的信用档案
        </Link>
      </div>

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, exchangeId: '', toUserId: '', toUserName: '' })}
        onSubmit={handleRate}
        toUserName={ratingModal.toUserName}
      />
    </div>
  )
}
