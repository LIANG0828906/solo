import { useState, useEffect } from 'react'
import type { Review } from '../types'
import StarRating from './StarRating'

interface ReviewsSectionProps {
  hostId: string
}

export default function ReviewsSection({ hostId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newContent, setNewContent] = useState('')
  const [userName, setUserName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [animateBars, setAnimateBars] = useState(false)

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/hosts/${hostId}/reviews`)
        const data: Review[] = await res.json()
        setReviews(data)
        setTimeout(() => setAnimateBars(true), 200)
      } catch (error) {
        console.error('获取评价失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [hostId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId,
          userName: userName.trim() || '匿名用户',
          rating: newRating,
          content: newContent.trim()
        })
      })

      if (res.ok) {
        const newReview: Review = await res.json()
        setReviews(prev => [newReview, ...prev])
        setNewContent('')
        setNewRating(5)
        setUserName('')
        setShowForm(false)
        setAnimateBars(false)
        setTimeout(() => setAnimateBars(true), 100)
      }
    } catch (error) {
      console.error('提交评价失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length
    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0
    return { star, count, percent }
  })

  return (
    <div className="reviews-section">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="section-title" style={{ fontSize: '24px' }}>
            用户评价 <span style={{ fontSize: '16px', color: 'var(--color-text-light)', fontWeight: 400 }}>({reviews.length}条)</span>
          </h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '取消' : '✍️ 写评价'}
        </button>
      </div>

      {reviews.length > 0 && (
        <div className="rating-overview">
          <div className="rating-score">
            <div className="rating-score-big">{avgRating.toFixed(1)}</div>
            <StarRating rating={avgRating} />
            <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px' }}>
              综合评分
            </div>
          </div>
          <div className="rating-bars">
            {ratingDistribution.map(({ star, count, percent }) => (
              <div key={star} className="rating-bar-row">
                <span className="rating-bar-label">{star}星</span>
                <div className="rating-bar">
                  <div
                    className={`rating-bar-fill ${animateBars ? 'animated' : ''}`}
                    style={{ width: animateBars ? `${percent}%` : '0%' }}
                  />
                </div>
                <span className="rating-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">您的评分：</label>
            <div className="rating-input" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <StarRating
                rating={newRating}
                interactive={true}
                onChange={setNewRating}
                size="large"
              />
              <span style={{ fontSize: '24px', color: 'var(--color-dark-brown)', fontWeight: 800 }}>
                {newRating}<span style={{ fontSize: '16px', color: 'var(--color-text-light)', fontWeight: 500 }}> 分</span>
              </span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
                {newRating === 5 ? '非常满意 🌟' : newRating === 4 ? '很满意 😊' : newRating === 3 ? '一般 🙂' : newRating === 2 ? '不太满意 😕' : '很不满意 😞'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">您的昵称（可选）：</label>
            <input
              type="text"
              className="form-textarea"
              style={{ minHeight: '40px', padding: '10px 14px' }}
              placeholder="请输入昵称"
              value={userName}
              onChange={e => setUserName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">评价内容：</label>
            <textarea
              className="form-textarea"
              placeholder="请分享您的寄养体验..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowForm(false)}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !newContent.trim()}
            >
              {submitting ? '提交中...' : '提交评价'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ padding: '40px 0' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ padding: '20px', background: 'var(--color-bg)', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-line short" style={{ height: '14px', marginBottom: '8px' }} />
                  <div className="skeleton skeleton-line short" style={{ height: '12px' }} />
                </div>
              </div>
              <div className="skeleton skeleton-line" style={{ height: '14px' }} />
              <div className="skeleton skeleton-line medium" style={{ height: '14px' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="review-list">
          {displayedReviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-text">暂无评价，成为第一个评价的人吧！</div>
            </div>
          ) : (
            displayedReviews.map((review, idx) => (
              <div
                key={review.id}
                className="review-item"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="review-header">
                  <img
                    src={review.userAvatar}
                    alt={review.userName}
                    className="review-avatar"
                  />
                  <div className="review-info">
                    <div className="review-author">{review.userName}</div>
                    <div className="review-date">{review.date}</div>
                  </div>
                  <StarRating rating={review.rating} size="small" />
                </div>
                <p className="review-content">{review.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {reviews.length > 3 && (
        <div className="review-expand">
          <button
            className="btn btn-outline"
            onClick={() => setShowAll(s => !s)}
          >
            {showAll ? '收起评价 ▲' : `查看全部 ${reviews.length} 条评价 ▼`}
          </button>
        </div>
      )}
    </div>
  )
}
