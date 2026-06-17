import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from './store';

interface ReviewModuleProps {
  galleryId: string;
}

const COOL_COLORS = [
  '#1E90FF', '#228B22', '#26619C', '#4169E1', '#483D8B',
  '#2E8B57', '#3CB371', '#4682B4', '#5F9EA0', '#6A5ACD'
];

const ReviewModule: React.FC<ReviewModuleProps> = ({ galleryId }) => {
  const { reviews, reviewCount, averageRating, reviewPage, reviewTotalPages, loading, fetchReviews, loadMoreReviews, createReview } = useStore();

  const [formUsername, setFormUsername] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchReviews(galleryId, 1);
  }, [galleryId, fetchReviews]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffH < 24) return `${diffH}小时前`;
    if (diffD < 7) return `${diffD}天前`;
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COOL_COLORS[Math.abs(hash) % COOL_COLORS.length];
  };

  const getInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase();
  };

  const handleSubmit = async () => {
    if (!formUsername.trim() || !formContent.trim() || formRating === 0) return;
    const result = await createReview({
      galleryId,
      username: formUsername.trim(),
      content: formContent.trim(),
      rating: formRating
    });
    if (result) {
      setFormUsername('');
      setFormContent('');
      setFormRating(0);
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating > 0 ? hoverRating : formRating;

  const renderStars = (rating: number, interactive: boolean = false, size: 'sm' | 'md' = 'sm') => {
    return (
      <span className={size === 'md' ? 'rating-stars' : 'rating-stars-static'}>
        {[1, 2, 3, 4, 5].map((i) => {
          let cls = '';
          if (interactive) {
            cls = `star interactive ${i <= displayRating ? 'filled' : 'empty'} ${i <= hoverRating ? 'hover' : ''}`;
          } else {
            cls = `star-static ${i <= rating ? 'filled' : 'empty'}`;
          }
          return (
            <span
              key={i}
              className={cls}
              onClick={interactive ? () => setFormRating(i) : undefined}
              onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
              onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            >
              ★
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="reviews-section">
      <div className="section-header" style={{ marginBottom: 0 }}>
        <h2 className="section-title">评论区</h2>
      </div>

      <div className="reviews-summary" style={{ marginTop: 24 }}>
        <div className="rating-display">
          <div className="average-rating">
            {reviewCount > 0 ? averageRating.toFixed(1) : '—'}
          </div>
          {renderStars(Math.round(averageRating), false, 'md')}
          <div className="review-count">共 {reviewCount} 条评论</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="review-form">
            <div className="review-input-row">
              <div className="form-group">
                <label className="form-label">昵称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value.slice(0, 20))}
                  placeholder="输入您的昵称"
                />
              </div>
              <div className="form-group">
                <label className="form-label">评分</label>
                <div className="rating-selector">
                  {renderStars(formRating, true, 'md')}
                  <span className="rating-label">
                    {formRating > 0 ? `${formRating}星` : '请选择'}
                  </span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">评论内容（限200字）</label>
              <textarea
                className="form-textarea"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value.slice(0, 200))}
                placeholder="分享您对这个画廊的感受..."
                style={{ minHeight: 80 }}
              />
              <div className="char-count">{formContent.length}/200</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!formUsername.trim() || !formContent.trim() || formRating === 0}
              >
                提交评论
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && reviews.length === 0 ? (
        <div className="loading">加载评论中...</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">还没有评论，快来发表第一条吧！</div>
        </div>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div
                  className="avatar"
                  style={{ background: getAvatarColor(review.username) }}
                >
                  {getInitial(review.username)}
                </div>
                <div className="review-body">
                  <div className="review-header">
                    <span className="review-username">{review.username}</span>
                    <span className="review-date">{formatDateTime(review.createdAt)}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    {renderStars(review.rating)}
                  </div>
                  <div className="review-content">{review.content}</div>
                </div>
              </div>
            ))}
          </div>
          {reviewPage < reviewTotalPages && (
            <button
              className="load-more-btn"
              onClick={() => loadMoreReviews(galleryId)}
            >
              加载更多评论
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewModule;
