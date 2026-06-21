import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuctions } from '../api/auctionApi'
import type { Auction, AuctionStatus } from '../types'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<AuctionStatus>('all')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [now, setNow] = useState(Date.now())

  const pageSize = 10

  const fetchAuctions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAuctions(page, pageSize, status, keyword)
      setAuctions(data.auctions)
      setTotal(data.total)
    } catch (err) {
      console.error('获取拍卖列表失败', err)
    } finally {
      setLoading(false)
    }
  }, [page, status, keyword])

  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = () => {
    setKeyword(searchInput.trim())
    setPage(1)
  }

  const handleStatusChange = (newStatus: AuctionStatus) => {
    setStatus(newStatus)
    setPage(1)
  }

  const getRemainingTime = (auction: Auction): string => {
    if (auction.status === 'ended') return '已结束'
    if (auction.status === 'upcoming') {
      const diff = auction.startTime - now
      if (diff <= 0) return '即将开始'
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      return `${mins}分${secs}秒后开始`
    }
    const remaining = auction.endTime - now
    if (remaining <= 0) return '已结束'
    const mins = Math.floor(remaining / 60000)
    const secs = Math.floor((remaining % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (auction: Auction) => {
    if (auction.status === 'ended') {
      if (auction.result === 'sold') {
        return <span className="status-badge badge-sold">已成交</span>
      }
      return <span className="status-badge badge-unsold">流拍</span>
    }
    if (auction.status === 'upcoming') {
      return <span className="status-badge badge-upcoming">未开始</span>
    }
    return <span className="status-badge badge-ongoing">进行中</span>
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <h1 className="app-title">🎯 拍卖小助理</h1>
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            + 发布拍卖
          </button>
        </div>
      </header>

      <div className="home-content">
        <div className="filter-bar">
          <div className="status-tabs">
            {(['all', 'ongoing', 'upcoming', 'ended'] as AuctionStatus[]).map((s) => (
              <button
                key={s}
                className={`status-tab ${status === s ? 'active' : ''}`}
                onClick={() => handleStatusChange(s)}
              >
                {s === 'all' ? '全部' : s === 'ongoing' ? '进行中' : s === 'upcoming' ? '未开始' : '已结束'}
              </button>
            ))}
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索拍卖商品..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            <button className="search-btn" onClick={handleSearch}>搜索</button>
          </div>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : auctions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>暂无拍卖商品</p>
          </div>
        ) : (
          <>
            <div className="auction-grid">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className="auction-card"
                  onClick={() => navigate(`/auction/${auction.id}`)}
                >
                  <div className="card-image">
                    <div className="image-placeholder" />
                    {getStatusBadge(auction)}
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{auction.title}</h3>
                    <div className="card-price">
                      <span className="price-label">当前价</span>
                      <span className="price-value">¥{auction.currentPrice}</span>
                    </div>
                    <div className={`card-time ${auction.status === 'ongoing' ? 'time-blink' : ''}`}>
                      {auction.status === 'ongoing' ? '⏱ ' : '🕐 '}
                      {getRemainingTime(auction)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  上一页
                </button>
                <span className="page-info">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <CreateAuctionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchAuctions()
          }}
        />
      )}
    </div>
  )
}

function CreateAuctionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startPrice, setStartPrice] = useState(1)
  const [startType, setStartType] = useState<'now' | 'scheduled'>('now')
  const [scheduledTime, setScheduledTime] = useState('')
  const [duration, setDuration] = useState(5)
  const [username, setUsername] = useState(localStorage.getItem('auction_username') || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('请输入商品标题')
      return
    }
    if (!username.trim()) {
      setError('请输入您的昵称')
      return
    }
    if (startPrice < 1 || !Number.isInteger(startPrice)) {
      setError('起拍价必须为正整数')
      return
    }
    if (duration < 3 || duration > 30) {
      setError('竞价时长需在3-30分钟之间')
      return
    }

    setSubmitting(true)
    try {
      const { createAuction } = await import('../api/auctionApi')
      
      let startTime: 'now' | number = 'now'
      if (startType === 'scheduled') {
        if (!scheduledTime) {
          setError('请选择开始时间')
          setSubmitting(false)
          return
        }
        startTime = new Date(scheduledTime).getTime()
        if (startTime <= Date.now()) {
          setError('开始时间必须晚于当前时间')
          setSubmitting(false)
          return
        }
      }

      localStorage.setItem('auction_username', username)

      await createAuction({
        title: title.trim(),
        description: description.trim(),
        startPrice,
        startTime,
        duration,
        creator: username.trim()
      })

      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>发布拍卖商品</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>您的昵称</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入您的昵称"
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label>商品标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入商品标题"
              maxLength={50}
            />
          </div>
          <div className="form-group">
            <label>商品描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入商品描述"
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>起拍价（元）*</label>
              <input
                type="number"
                min="1"
                step="1"
                value={startPrice}
                onChange={(e) => setStartPrice(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label>竞价时长（分钟）*</label>
              <input
                type="number"
                min="3"
                max="30"
                step="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>开始时间</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="startType"
                  checked={startType === 'now'}
                  onChange={() => setStartType('now')}
                />
                立即开始
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="startType"
                  checked={startType === 'scheduled'}
                  onChange={() => setStartType('scheduled')}
                />
                定时开始
              </label>
            </div>
            {startType === 'scheduled' && (
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="datetime-input"
              />
            )}
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '发布中...' : '发布拍卖'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
