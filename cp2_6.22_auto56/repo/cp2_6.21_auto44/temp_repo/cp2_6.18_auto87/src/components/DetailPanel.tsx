import React, { useState, useRef, useEffect } from 'react';
import type { Landmark } from '../types';
import { useLandmarkStore } from '../store/landmarkStore';
import { formatRelativeTime } from '../utils/helpers';
import {
  CloseIcon,
  StarIcon,
  ShareIcon,
  HistoryIcon,
  ChevronDownIcon,
  ClockIcon,
  InfoIcon,
} from './Icons';

interface DetailPanelProps {
  landmark: Landmark | undefined;
}

const TimelineItem: React.FC<{
  year: string;
  title: string;
  description: string;
}> = ({ year, title, description }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState('0px');

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setMaxHeight(`${contentRef.current.scrollHeight + 20}px`);
      } else {
        setMaxHeight('0px');
      }
    }
  }, [isOpen]);

  return (
    <div className="timeline-item" onClick={() => setIsOpen(!isOpen)}>
      <div className="timeline-dot" />
      <div className="timeline-header">
        <span className="timeline-year">{year}</span>
        <span className="timeline-title">{title}</span>
        <ChevronDownIcon className={`timeline-toggle ${isOpen ? 'open' : ''}`} />
      </div>
      <div
        ref={contentRef}
        className={`timeline-description ${isOpen ? 'open' : ''}`}
        style={{ maxHeight }}
      >
        <div className="timeline-description-content">
          {description}
        </div>
      </div>
    </div>
  );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="review-rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <StarIcon
        key={n}
        className={`review-star ${n <= rating ? 'filled' : ''}`}
        filled={n <= rating}
      />
    ))}
  </div>
);

const Toast: React.FC<{ message: string }> = ({ message }) => (
  <div className="toast">{message}</div>
);

const DetailPanel: React.FC<DetailPanelProps> = ({ landmark }) => {
  const {
    setSelectedLandmark,
    favoriteIds,
    toggleFavorite,
    reviewSortType,
    setReviewSortType,
  } = useLandmarkStore();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isFavorite = landmark ? favoriteIds.includes(landmark.id) : false;

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleShare = async () => {
    if (!landmark) return;
    const shareUrl = `${window.location.origin}?landmark=${landmark.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('链接已复制到剪贴板');
    } catch {
      showToast('复制失败，请手动复制');
    }
  };

  const handleClose = () => {
    setSelectedLandmark(null);
    setImageLoaded(false);
  };

  if (!landmark) {
    return (
      <div className="detail-panel">
        <div className="detail-panel-empty">
          <InfoIcon className="detail-panel-empty-icon" />
          <p className="detail-panel-empty-text">点击地图上的标记或搜索地标查看详细信息</p>
        </div>
      </div>
    );
  }

  const sortedReviews = [...landmark.reviews].sort((a, b) => {
    if (reviewSortType === 'time') {
      return b.timestamp - a.timestamp;
    }
    return b.rating - a.rating;
  });

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <button
          className="detail-close"
          onClick={handleClose}
          title="关闭"
        >
          <CloseIcon style={{ width: 18, height: 18 }} />
        </button>
        <button
          className="detail-favorite-btn"
          onClick={() => toggleFavorite(landmark.id)}
          title={isFavorite ? '取消收藏' : '收藏'}
        >
          <StarIcon filled={isFavorite} style={{ width: 20, height: 20 }} />
        </button>
        {!imageLoaded && <div className="detail-image-placeholder" />}
        <div
          className="detail-image"
          style={{
            backgroundImage: `url(${landmark.imageUrl})`,
            display: imageLoaded ? 'block' : 'none',
          }}
        />
        <img
          src={landmark.imageUrl}
          alt={landmark.name}
          style={{ display: 'none' }}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      <div className="detail-content">
        <h1 className="detail-title">{landmark.name}</h1>

        <button className="detail-share-btn" onClick={handleShare}>
          <ShareIcon style={{ width: 14, height: 14 }} />
          分享链接
        </button>

        <p className="detail-description">{landmark.description}</p>

        <div>
          <h2 className="detail-section-title">
            <HistoryIcon className="detail-section-title-icon" />
            历史时间线
          </h2>
          <div className="timeline">
            {landmark.history.map((event, index) => (
              <TimelineItem
                key={index}
                year={event.year}
                title={event.title}
                description={event.description}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="reviews-header">
            <h2 className="detail-section-title" style={{ marginBottom: 0 }}>
              <ClockIcon className="detail-section-title-icon" />
              用户评论 ({landmark.reviews.length})
            </h2>
            <div className="sort-tabs">
              <button
                className={`sort-tab ${reviewSortType === 'time' ? 'active' : ''}`}
                onClick={() => setReviewSortType('time')}
              >
                最新
              </button>
              <button
                className={`sort-tab ${reviewSortType === 'rating' ? 'active' : ''}`}
                onClick={() => setReviewSortType('rating')}
              >
                高分
              </button>
            </div>
          </div>

          <div className="reviews-list">
            {sortedReviews.map((review) => (
              <div key={review.id} className="review-item">
                <div
                  className="review-avatar"
                  style={{ background: review.avatarGradient }}
                >
                  {review.userName.charAt(0)}
                </div>
                <div className="review-content">
                  <div className="review-header">
                    <span className="review-name">{review.userName}</span>
                    <span className="review-time">{formatRelativeTime(review.timestamp)}</span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="review-text">{review.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
};

export default DetailPanel;
