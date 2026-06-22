import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { itemsAPI, exchangesAPI, Item, Exchange } from '../api'
import { formatTimeAgo, getDaysSince, getCategoryLabel, getStatusLabel } from '../utils'
import './ProfilePage.css'

type TabType = 'myItems' | 'myExchanges'

const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('myItems')
  const [items, setItems] = useState<Item[]>([])
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (activeTab === 'myItems') {
      fetchMyItems()
    } else {
      fetchMyExchanges()
    }
  }, [user, activeTab, navigate])

  const fetchMyItems = async () => {
    setLoading(true)
    try {
      const data = await itemsAPI.getItemsByOwner(user!.id)
      setItems(data)
    } catch (error) {
      showToast('获取物品列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyExchanges = async () => {
    setLoading(true)
    try {
      const data = await exchangesAPI.getMyExchanges()
      setExchanges(data)
    } catch (error) {
      showToast('获取交换记录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const registerDays = getDaysSince(user.createdAt)

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header scale-in">
          <div className="profile-avatar">
            {user.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{user.nickname}</h1>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{user.creditScore}</span>
                <span className="stat-label">信用分</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{registerDays}</span>
                <span className="stat-label">注册天数</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">📍 {user.city}</span>
                <span className="stat-label">所在城市</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'myItems' ? 'active' : ''}`}
            onClick={() => setActiveTab('myItems')}
          >
            我发布的
          </button>
          <button
            className={`tab-btn ${activeTab === 'myExchanges' ? 'active' : ''}`}
            onClick={() => setActiveTab('myExchanges')}
          >
            我参与的
          </button>
        </div>

        <div className="profile-content">
          {loading ? (
            <div className="profile-loading">
              <div className="spinner spinner-primary" />
            </div>
          ) : activeTab === 'myItems' ? (
            <div className="items-list">
              {items.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p>你还没有发布任何物品</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/publish')}
                  >
                    去发布
                  </button>
                </div>
              ) : (
                <div className="profile-items-grid">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="profile-item-card card"
                      onClick={() => navigate(`/items/${item.id}`)}
                    >
                      <div className="item-thumb">
                        <img src={item.images[0]} alt={item.title} />
                        <span className={`status-badge status-${item.status}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className="item-info">
                        <h4 className="item-title">{item.title}</h4>
                        <div className="item-meta">
                          <span>{getCategoryLabel(item.category)}</span>
                          <span>{formatTimeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="exchanges-list">
              {exchanges.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔄</div>
                  <p>你还没有参与任何交换</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/')}
                  >
                    去逛逛
                  </button>
                </div>
              ) : (
                <div className="exchange-list">
                  {exchanges.map((exchange) => {
                    const isRequester = exchange.requesterId === user.id
                    const otherParty = isRequester ? exchange.owner : exchange.requester
                    const myRating = isRequester ? exchange.requesterRating : exchange.ownerRating
                    const otherRating = isRequester ? exchange.ownerRating : exchange.requesterRating

                    return (
                      <div key={exchange.id} className="exchange-item card">
                        <div className="exchange-header">
                          <div className="exchange-item-info">
                            <img
                              src={exchange.item?.images[0]}
                              alt={exchange.item?.title}
                              className="exchange-item-img"
                            />
                            <div>
                              <h4 className="exchange-item-title">
                                {exchange.item?.title}
                              </h4>
                              <p className="exchange-role">
                                {isRequester ? '我发起的' : '他人发起的'}
                              </p>
                            </div>
                          </div>
                          <span className={`exchange-status status-${exchange.status}`}>
                            {getStatusLabel(exchange.status)}
                          </span>
                        </div>

                        <div className="exchange-parties">
                          <div className="party-info">
                            <div className="party-avatar">
                              {otherParty?.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="party-name">{otherParty?.nickname}</p>
                              <p className="party-credit">信用分: {otherParty?.creditScore}</p>
                            </div>
                          </div>
                          <span className="exchange-arrow">→</span>
                        </div>

                        {exchange.status === 'completed' && (
                          <div className="exchange-ratings">
                            <div className="rating-item">
                              <span className="rating-label">我的评价:</span>
                              {myRating ? (
                                <span className="stars">
                                  {'★'.repeat(myRating)}
                                  {'☆'.repeat(5 - myRating)}
                                </span>
                              ) : (
                                <span className="no-rating">未评价</span>
                              )}
                            </div>
                            <div className="rating-item">
                              <span className="rating-label">对方评价:</span>
                              {otherRating ? (
                                <span className="stars">
                                  {'★'.repeat(otherRating)}
                                  {'☆'.repeat(5 - otherRating)}
                                </span>
                              ) : (
                                <span className="no-rating">未评价</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="exchange-time">
                          {formatTimeAgo(exchange.updatedAt)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
