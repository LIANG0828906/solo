import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { exchangesAPI, Exchange } from '../api'
import { formatTimeAgo, getStatusLabel } from '../utils'
import './ExchangeRequestsPage.css'
import RatingModal from '../components/RatingModal'

type TabType = 'received' | 'sent'

const ExchangeRequestsPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('received')
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(false)
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean; exchange: Exchange | null; mode: 'requester' | 'owner' }>({
    isOpen: false,
    exchange: null,
    mode: 'requester',
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchExchanges()
  }, [user, navigate])

  const fetchExchanges = async () => {
    setLoading(true)
    try {
      const data = await exchangesAPI.getMyExchanges()
      setExchanges(data)
    } catch (error) {
      showToast('获取交换请求失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (exchangeId: string) => {
    try {
      await exchangesAPI.acceptExchange(exchangeId)
      showToast('已同意交换请求', 'success')
      fetchExchanges()
    } catch (error: any) {
      showToast(error.response?.data?.message || '操作失败', 'error')
    }
  }

  const handleReject = async (exchangeId: string) => {
    try {
      await exchangesAPI.rejectExchange(exchangeId)
      showToast('已拒绝交换请求', 'info')
      fetchExchanges()
    } catch (error: any) {
      showToast(error.response?.data?.message || '操作失败', 'error')
    }
  }

  const handleRate = (exchange: Exchange, mode: 'requester' | 'owner') => {
    setRatingModal({ isOpen: true, exchange, mode })
  }

  const handleRateSuccess = () => {
    setRatingModal({ isOpen: false, exchange: null, mode: 'requester' })
    fetchExchanges()
    showToast('评价成功', 'success')
  }

  const filteredExchanges = exchanges.filter((e) => {
    if (activeTab === 'received') {
      return e.ownerId === user?.id
    }
    return e.requesterId === user?.id
  })

  if (!user) return null

  return (
    <div className="exchange-requests-page">
      <div className="container">
        <h1 className="page-title">交换请求</h1>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            收到的请求
          </button>
          <button
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            发出的请求
          </button>
        </div>

        <div className="requests-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner spinner-primary" />
            </div>
          ) : filteredExchanges.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>{activeTab === 'received' ? '暂未收到交换请求' : '还没有发出过请求'}</p>
            </div>
          ) : (
            <div className="requests-list">
              {filteredExchanges.map((exchange) => {
              const otherParty =
                activeTab === 'received' ? exchange.requester : exchange.owner
              const isOwner = exchange.ownerId === user.id
              const hasRated = isOwner
                ? exchange.ownerRating !== undefined
                : exchange.requesterRating !== undefined
              const canRate =
                exchange.status === 'accepted' && !hasRated

              return (
                <div key={exchange.id} className="request-card card">
                  <div className="request-header">
                    <div className="item-info">
                      <img
                        src={exchange.item?.images[0]}
                        alt={exchange.item?.title}
                        className="item-img"
                      />
                      <div className="item-details">
                        <h3
                          className="item-title"
                          onClick={() => navigate(`/items/${exchange.itemId}`)}
                        >
                          {exchange.item?.title}
                        </h3>
                        <p className="item-time">
                          {formatTimeAgo(exchange.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`status-tag status-${exchange.status}`}>
                      {getStatusLabel(exchange.status)}
                    </span>
                  </div>

                  <div className="request-body">
                    <div className="user-info">
                      <div className="user-avatar">
                        {otherParty?.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="user-name">{otherParty?.nickname}</p>
                      <p className="user-credit">信用分: {otherParty?.creditScore}</p>
                    </div>
                  </div>

                    {exchange.message && (
                    <div className="message-box">
                      <p className="message-label">留言:</p>
                      <p className="message-content">{exchange.message}</p>
                    </div>
                  )}
                  </div>

                  <div className="request-actions">
                    {isOwner && exchange.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleReject(exchange.id)}
                        >
                          拒绝
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAccept(exchange.id)}
                        >
                          同意
                        </button>
                      </>
                    )}

                    {canRate && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRate(exchange, isOwner ? 'owner' : 'requester'}
                      >
                        去评价
                      </button>
                    )}

                    {exchange.status === 'completed' && (
                      <span className="completed-text">已完成评价</span>
                    )}

                    {exchange.status === 'rejected' && !isOwner && (
                      <span className="rejected-text">对方已拒绝</span>
                    )}
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </div>
      </div>

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, exchange: null, mode: 'requester' })}
        exchange={ratingModal.exchange!}
        mode={ratingModal.mode}
        onSuccess={handleRateSuccess}
      />
    </div>
  )
}

export default ExchangeRequestsPage
