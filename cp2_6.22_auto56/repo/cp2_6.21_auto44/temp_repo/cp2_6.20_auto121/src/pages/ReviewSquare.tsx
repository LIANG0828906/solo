import React, { useCallback, useEffect, useRef } from 'react';
import { useReviewStore } from '../stores/reviewStore';
import { useUserStore } from '../stores/userStore';

interface ReviewSquareProps {
  onWriteReview: () => void;
}

const ReviewSquare: React.FC<ReviewSquareProps> = ({ onWriteReview }) => {
  const { reviews, toggleLike, fetchMore } = useReviewStore();
  const user = useUserStore((s) => s.user);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reviews.length === 0) fetchMore();
  }, []);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) fetchMore();
    },
    [fetchMore]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [handleIntersect]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">书评广场</h1>
        <button
          onClick={onWriteReview}
          style={{
            padding: '8px 24px',
            borderRadius: '20px',
            border: 'none',
            background: 'linear-gradient(135deg, #3498db, #2ecc71)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ✍️ 写书评
        </button>
      </div>
      <div className="waterfall-grid">
        {reviews.map((review) => {
          const isLiked = review.likedBy.includes(user?.id || '');
          return (
            <div key={review.id} className="review-card">
              {review.bookCover && (
                <img className="review-card-cover" src={review.bookCover} alt="" />
              )}
              <div className="review-card-body">
                <div className="review-card-title">{review.bookTitle}</div>
                <div className="review-card-author">by {review.author}</div>
                <div className="review-card-content">{review.content}</div>
                {review.tags.length > 0 && (
                  <div className="review-card-tags">
                    {review.tags.map((tag, i) => (
                      <span key={i} className="review-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="review-card-actions">
                  <button
                    className={`action-btn${isLiked ? ' liked' : ''}`}
                    onClick={() => toggleLike(review.id, user?.id || '')}
                  >
                    <span className="heart-icon">{isLiked ? '❤️' : '🤍'}</span>
                    <span>{review.likes}</span>
                  </button>
                  <button className="action-btn">
                    💬 <span>{review.commentCount}</span>
                  </button>
                  <button className="action-btn">⚔️ 辩论</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
};

export default ReviewSquare;
