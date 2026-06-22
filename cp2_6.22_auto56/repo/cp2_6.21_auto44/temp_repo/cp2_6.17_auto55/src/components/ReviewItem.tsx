import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';
import type { Review } from '../types';
import { useStore } from '../store';
import StarRating from './StarRating';

interface ReviewItemProps {
  review: Review;
}

const formatRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  if (diffWeek < 5) return `${diffWeek}周前`;
  if (diffMonth < 12) return `${diffMonth}个月前`;
  return `${diffYear}年前`;
};

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  const navigate = useNavigate();
  const { currentUser, toggleLikeReview } = useStore();
  const isLiked = currentUser ? review.likedBy.includes(currentUser.id) : false;

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const handleLike = () => {
    if (currentUser) {
      toggleLikeReview(review.id);
    }
  };

  return (
    <div className="review-item">
      <div
        className="avatar-sm"
        style={{
          width: '32px',
          height: '32px',
          background: review.userAvatarColor,
          fontSize: '14px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => navigate(`/profile/${review.username}`)}
      >
        {getInitial(review.username)}
      </div>
      <div className="review-body">
        <div className="review-header">
          <span
            className="review-username"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${review.username}`)}
          >
            {review.username}
          </span>
          <span className="review-time">{formatRelativeTime(review.createdAt)}</span>
        </div>
        <StarRating rating={review.rating} />
        <p className="review-content">{review.content}</p>
        <button
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          style={{ background: 'none', border: 'none', color: isLiked ? '#E74C3C' : 'var(--color-text-gray)' }}
        >
          <ThumbsUp size={16} fill={isLiked ? '#E74C3C' : 'none'} />
          <span>{review.likedBy.length}</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewItem;
