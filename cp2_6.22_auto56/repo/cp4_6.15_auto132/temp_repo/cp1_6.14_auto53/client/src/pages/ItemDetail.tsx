import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { itemsAPI, Item } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ExchangeModal from '../components/ExchangeModal'
import { formatTimeAgo, getCategoryLabel, getConditionLabel } from '../utils'
import './ItemDetail.css'

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [imageTransition, setImageTransition] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchItem()
  }, [id])

  const fetchItem = async () => {
    setLoading(true)
    try {
      const data = await itemsAPI.getItem(id!)
      setItem(data)
    } catch (error: any) {
      showToast(error.response?.data?.message || '获取物品详情失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevImage = () => {
    if (!item || item.images.length <= 1) return
    setImageTransition(true)
    setTimeout(() => {
      setCurrentImageIndex((prev) =>
        prev === 0 ? item.images.length - 1 : prev - 1
      )
      setImageTransition(false)
    }, 150)
  }

  const handleNextImage = () => {
    if (!item || item.images.length <= 1) return
    setImageTransition(true)
    setTimeout(() => {
      setCurrentImageIndex((prev) =>
        prev === item.images.length - 1 ? 0 : prev + 1
      )
      setImageTransition(false)
    }, 150)
  }

  const handleExchangeClick = () => {
    if (!user) {
      showToast('请先登录', 'warning')
      navigate('/login')
      return
    }
    if (item?.ownerId === user.id) {
      showToast('不能交换自己的物品', 'warning')
      return
    }
    if (item?.status !== 'available') {
      showToast('该物品暂不可交换', 'warning')
      return
    }
    setShowExchangeModal(true)
  }

  const handleExchangeSuccess = () => {
    fetchItem()
  }

  if (loading) {
    return (
      <div className="item-detail-loading">
        <div className="spinner spinner-primary" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="item-detail-not-found">
        <h2>物品不存在</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="item-detail-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>

        <div className="item-detail-content">
          <div className="item-images">
            <div className="main-image">
              <img
                src={item.images[currentImageIndex]}
                alt={item.title}
                className={imageTransition ? 'fade' : ''}
              />
              {item.images.length > 1 && (
                <>
                  <button
                    className="image-arrow left"
                    onClick={handlePrevImage}
                  >
                    ‹
                  </button>
                  <button
                    className="image-arrow right"
                    onClick={handleNextImage}
                  >
                    ›
                  </button>
                </>
              )}
              {item.status !== 'available' && (
                <div className={`item-status-badge status-${item.status}`}>
                  {item.status === 'exchanging' ? '交换中' : '已交换'}
                </div>
              )}
            </div>
            {item.images.length > 1 && (
              <div className="thumbnail-list">
                {item.images.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${currentImageIndex === index ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={img} alt={`${item.title} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="item-info">
            <div className="item-header">
              <span className={`status-tag status-${item.status}`}>
                {getStatusLabel(item.status)}
              </span>
              <span className="category-tag">{getCategoryLabel(item.category)}</span>
            </div>

            <h1 className="item-title">{item.title}</h1>

            <div className="item-meta">
              <span>📍 {item.city}</span>
              <span>⏱ {formatTimeAgo(item.createdAt)}</span>
              <span>🔄 {getConditionLabel(item.condition)}</span>
            </div>

            <div className="item-description">
              <h3>物品描述</h3>
              <p>{item.description || '暂无描述'}</p>
            </div>

            <div className="owner-info">
              <div className="owner-avatar">
                {item.owner?.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="owner-details">
                <p className="owner-name">{item.owner?.nickname}</p>
                <p className="owner-credit">信用分: {item.owner?.creditScore}</p>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-primary exchange-btn"
                onClick={handleExchangeClick}
                disabled={item.status !== 'available' || item.ownerId === user?.id}
              >
                {item.ownerId === user?.id
                  ? '这是你的物品'
                  : item.status === 'available'
                  ? '发起交换请求'
                  : item.status === 'exchanging'
                  ? '交换中'
                  : '已交换'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ExchangeModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        itemId={item.id}
        onSuccess={handleExchangeSuccess}
      />
    </div>
  )
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    available: '可交换',
    exchanging: '交换中',
    exchanged: '已交换',
  }
  return map[status] || status
}

export default ItemDetail
