import React from 'react';
import type { Comment } from '../store/recipeStore';

interface CommentItemProps {
  comment: Comment;
  isNew?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, isNew = false }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="comment-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`comment-star ${star <= rating ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`comment-item ${isNew ? 'comment-new' : ''}`}>
      <img
        src={comment.user.avatar}
        alt={comment.user.name}
        className="comment-avatar"
      />
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-username">{comment.user.name}</span>
          <span className="comment-time">{comment.createdAt}</span>
        </div>
        {renderStars(comment.rating)}
        <p className="comment-text">{comment.content}</p>
      </div>
    </div>
  );
};

export default CommentItem;
