import React, { useEffect, useState, useCallback } from 'react';
import TagCloud from './TagCloud';
import { getReputation } from '../utils/api';
import type { ReputationData } from '../types';

interface ReputationModalProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
}

const ReputationModal: React.FC<ReputationModalProps> = ({ courseId, courseName, onClose }) => {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getReputation(courseId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">「{courseName}」口碑详情</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="modal-body">
          {loading && (
            <div className="loading">
              <span className="loading-spinner"></span>
              加载中...
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {data && !loading && (
            <>
              <TagCloud tags={data.tags} />

              <div>
                <h4 className="section-title">最近用户评价</h4>
                <div className="reviews-list">
                  {data.recentReviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <span className="review-rating">{renderStars(review.rating)}</span>
                        <span className="review-date">{review.createdAt}</span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReputationModal;
