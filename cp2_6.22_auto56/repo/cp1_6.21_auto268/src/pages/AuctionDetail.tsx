import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAuctionById } from '../api/auctionApi'
import { getSocket } from '../utils/socket'
import BidPanel from '../components/BidPanel'
import type { Auction, Bid } from '../types'
import './AuctionDetail.css'

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [showResultModal, setShowResultModal] = useState(false)
  const [hasShownResult, setHasShownResult] = useState(false)

  const fetchAuction = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getAuctionById(id)
      setAuction(data)
    } catch (err) {
      console.error('获取拍卖详情失败', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAuction()
  }, [fetchAuction])

  useEffect(() => {
    const socket = getSocket()

    socket.emit('auction:join', id)

    socket.on('bid:update', (data: { auctionId: string; bid: Bid; currentPrice: number }) => {
      if (data.auctionId === id) {
        setAuction(prev => {
          if (!prev) return prev
          return {
            ...prev,
            currentPrice: data.currentPrice,
            bids: [data.bid, ...prev.bids]
          }
        })
      }
    })

    socket.on('time:extend', (data: { auctionId: string; endTime: number }) => {
      if (data.auctionId === id) {
        setAuction(prev => {
          if (!prev) return prev
          return { ...prev, endTime: data.endTime }
        })
      }
    })

    socket.on('auction:end', (data: { auctionId: string; result: 'sold' | 'unsold'; winner?: string; finalPrice: number }) => {
      if (data.auctionId === id) {
        setAuction(prev => {
          if (!prev) return prev
          return {
            ...prev,
            status: 'ended',
            result: data.result,
            winner: data.winner,
            currentPrice: data.finalPrice
          }
        })
        if (!hasShownResult) {
          setShowResultModal(true)
          setHasShownResult(true)
        }
      }
    })

    return () => {
      socket.emit('auction:leave', id)
      socket.off('bid:update')
      socket.off('time:extend')
      socket.off('auction:end')
    }
  }, [id, hasShownResult])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
      
      setAuction(prev => {
        if (!prev || prev.status === 'ended') return prev
        
        if (prev.status === 'upcoming' && prev.startTime <= Date.now()) {
          return { ...prev, status: 'ongoing' }
        }
        
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getRemainingTime = (): string => {
    if (!auction) return '--:--'
    if (auction.status === 'ended') return '已结束'
    if (auction.status === 'upcoming') {
      const diff = auction.startTime - now
      if (diff <= 0) return '即将开始'
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      return `${mins}分${secs}秒后开始`
    }
    const remaining = auction.endTime - now
    if (remaining <= 0) return '00:00'
    const mins = Math.floor(remaining / 60000)
    const secs = Math.floor((remaining % 60000) / 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusBadge = () => {
    if (!auction) return null
    if (auction.status === 'ended') {
      if (auction.result === 'sold') {
        return <span className="detail-status badge-sold">已成交</span>
      }
      return <span className="detail-status badge-unsold">流拍</span>
    }
    if (auction.status === 'upcoming') {
      return <span className="detail-status badge-upcoming">未开始</span>
    }
    return <span className="detail-status badge-ongoing">进行中</span>
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="detail-page">
        <div className="empty-state">
          <p>拍卖不存在</p>
          <button className="btn-primary" onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    )
  }

  const isOngoing = auction.status === 'ongoing'

  return (
    <div className="detail-page">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1 className="detail-title">拍卖详情</h1>
        {getStatusBadge()}
      </header>

      <div className="detail-content">
        <div className="detail-main">
          <div className="product-section">
            <div className="product-image">
              <div className="product-image-placeholder" />
            </div>
            <div className="product-info">
              <h2 className="product-title">{auction.title}</h2>
              <p className="product-desc">
                {auction.description || '暂无商品描述'}
              </p>
              <div className="product-meta">
                <span>发布者: {auction.creator}</span>
                <span>起拍价: ¥{auction.startPrice}</span>
              </div>
            </div>
          </div>

          <div className="price-section">
            <div className="current-price-box">
              <span className="price-label">当前最高出价</span>
              <span className="current-price">¥{auction.currentPrice}</span>
            </div>
            <div className={`countdown-box ${isOngoing ? 'countdown-blink' : ''}`}>
              <span className="countdown-label">
                {auction.status === 'upcoming' ? '距离开始' : '剩余时间'}
              </span>
              <span className="countdown-time">{getRemainingTime()}</span>
            </div>
          </div>

          <div className="bids-section">
            <h3 className="section-title">出价历史</h3>
            {auction.bids.length === 0 ? (
              <div className="no-bids">暂无出价</div>
            ) : (
              <div className="bids-list">
                {auction.bids.map((bid, index) => (
                  <div key={bid.id} className={`bid-item ${index === 0 ? 'bid-latest' : ''}`}>
                    <div className="bid-info">
                      <span className="bidder-name">{bid.bidder}</span>
                      {index === 0 && <span className="bid-tag">领先</span>}
                    </div>
                    <div className="bid-amount">¥{bid.amount}</div>
                    <div className="bid-time">{formatTime(bid.timestamp)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="detail-sidebar">
          <BidPanel
            auctionId={auction.id}
            currentPrice={auction.currentPrice}
            disabled={!isOngoing}
          />
          
          {auction.status === 'ended' && auction.result === 'sold' && (
            <div className="result-card sold-card">
              <div className="result-icon">🎉</div>
              <div className="result-text">
                <h4>拍卖成交</h4>
                <p>中标者: {auction.winner}</p>
                <p>成交价: ¥{auction.currentPrice}</p>
              </div>
            </div>
          )}
          
          {auction.status === 'ended' && auction.result === 'unsold' && (
            <div className="result-card unsold-card">
              <div className="result-icon">😔</div>
              <div className="result-text">
                <h4>拍卖流拍</h4>
                <p>无人出价</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showResultModal && (
        <div className="modal-overlay">
          <div className="result-modal">
            <div className="result-modal-content">
              {auction.result === 'sold' ? (
                <>
                  <div className="result-modal-icon">🎉</div>
                  <h2 className="result-modal-title">拍卖成交！</h2>
                  <p className="result-modal-desc">
                    恭喜 <strong>{auction.winner}</strong> 成功拍得
                  </p>
                  <p className="result-modal-price">¥{auction.currentPrice}</p>
                </>
              ) : (
                <>
                  <div className="result-modal-icon">😔</div>
                  <h2 className="result-modal-title">拍卖流拍</h2>
                  <p className="result-modal-desc">本次拍卖无人出价</p>
                </>
              )}
              <button
                className="result-modal-btn"
                onClick={() => setShowResultModal(false)}
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
