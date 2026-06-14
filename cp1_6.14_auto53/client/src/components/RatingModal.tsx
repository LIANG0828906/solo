import React, { useState } from 'react'
import { Exchange } from '../api'
import { exchangesAPI } from '../api'
import { useToast } from '../context/ToastContext'
import './RatingModal.css'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  exchange: Exchange
  mode: 'requester' | 'owner'
  onSuccess: () => void
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  exchange,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || !exchange) return

    setLoading(true)
    try {
      await exchangesAPI.rateExchange(exchange.id, { rating, comment })
      onSuccess()
    } catch (error: any) {
      showToast(error.response?.data?.message || '评价失败', 'error')
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }

  if (!isOpen || !exchange) return null

  const getRatingText = (r: number) => {
    const texts = ['很不满意', '不太满意', '一般', '满意', '非常满意']
    return texts[r - 1] || ''
  }

  return (
    <div className="rating-modal-overlay" onClick={handleOverlayClick}>
      <div className="rating-modal-content scale-in">
        <div className="rating-modal-header">
          <h3>评价交换</h3>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rating-modal-body">
            <div className="rating-section">
              <label className="rating-label">评分</label>
              <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="rating-text">{getRatingText(rating)}</p>
            </div>

            <div className="rating-section">
              <label className="rating-label">评价内容</label>
              <textarea
                className="rating-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                placeholder="写下你的评价..."
                rows={4}
                maxLength={200}
                disabled={loading}
              />
              <div className="char-count">{comment.length}/200</div>
            </div>
          </div>

          <div className="rating-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? '提交中...' : '提交评价'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RatingModal
