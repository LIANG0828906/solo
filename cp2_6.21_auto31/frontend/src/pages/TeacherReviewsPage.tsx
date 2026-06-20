import React, { useState, useEffect } from 'react'
import moment from 'moment'
import { Review, getMyReviews } from '../modules/teachers/TeacherService'
import './TeacherReviewsPage.css'

const TeacherReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const data = await getMyReviews()
      setReviews(data)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    const emptyStars = 5 - Math.ceil(rating)
    return (
      <>
        <span style={{ color: '#f39c12' }}>{'★'.repeat(fullStars)}</span>
        {hasHalf && <span style={{ color: '#f39c12' }}>☆</span>}
        <span style={{ color: '#ddd' }}>{'☆'.repeat(emptyStars)}</span>
      </>
    )
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <div className="teacher-reviews-page">
      <h1 className="page-title">评价管理</h1>

      <div className="reviews-stats">
        <div className="stat-card">
          <div className="stat-value">{averageRating}</div>
          <div className="stat-label">综合评分</div>
          <div className="stat-stars">{renderStars(Number(averageRating))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reviews.length}</div>
          <div className="stat-label">总评价数</div>
        </div>
      </div>

      <div className="reviews-list-section">
        <h2 className="section-title">全部评价</h2>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-user-info">
                    <div className="review-avatar">
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="review-user-name">{review.userName}</div>
                      <div className="review-date">
                        {moment(review.createdAt).format('YYYY-MM-DD')}
                      </div>
                    </div>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                    <span className="rating-number">{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reviews">
            <p>暂无评价</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherReviewsPage
