import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import type { Comment } from '@/types';
import { formatRelativeTime } from '@/utils/dateFormat';

interface CommentItemProps {
  comment: Comment;
  currentUser: string;
  onLike: (commentId: string) => void;
  onReply: (commentId: string, authorName: string) => void;
  replies?: Comment[];
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onLike,
  onReply,
  replies = [],
}) => {
  const [isLiked, setIsLiked] = useState(comment.likedBy.includes(currentUser));
  const [isAnimating, setIsAnimating] = useState(false);

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const handleLike = () => {
    if (!currentUser) return;
    setIsAnimating(true);
    setIsLiked(!isLiked);
    onLike(comment.id);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleReply = () => {
    if (!currentUser) return;
    onReply(comment.id, comment.authorName);
  };

  return (
    <>
      <div className="comment-item" key={comment.id}>
        <div className="avatar">{getInitial(comment.authorName)}</div>
        <div className="comment-content">
          <div className="comment-header">
            <div className="comment-author">
              <span className="comment-author-name">{comment.authorName}</span>
              <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
            </div>
          </div>
          <p className="comment-text">{comment.content}</p>
          <div className="comment-actions">
            <button
              className={`like-button ${isLiked ? 'liked' : ''} ${isAnimating ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={!currentUser}
            >
              <Heart
                size={16}
                className="heart-icon"
                fill={isLiked ? 'currentColor' : 'none'}
              />
              <span>{comment.likes}</span>
            </button>
            {!comment.parentId && (
              <button className="comment-action" onClick={handleReply} disabled={!currentUser}>
                <MessageCircle size={16} />
                <span>回复</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {replies.map(reply => (
        <div key={reply.id} className="comment-item comment-reply">
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            {getInitial(reply.authorName)}
          </div>
          <div className="comment-content">
            <div className="comment-header">
              <div className="comment-author">
                <span className="comment-author-name">{reply.authorName}</span>
                <span className="comment-time">{formatRelativeTime(reply.createdAt)}</span>
              </div>
            </div>
            <p className="comment-text">{reply.content}</p>
            <div className="comment-actions">
              <button
                className={`like-button ${reply.likedBy.includes(currentUser) ? 'liked' : ''}`}
                onClick={() => onLike(reply.id)}
                disabled={!currentUser}
              >
                <Heart
                  size={14}
                  className="heart-icon"
                  fill={reply.likedBy.includes(currentUser) ? 'currentColor' : 'none'}
                />
                <span>{reply.likes}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
