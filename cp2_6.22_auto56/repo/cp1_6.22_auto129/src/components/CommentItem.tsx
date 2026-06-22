import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Comment, User } from '../types';
import { getUserById, likeComment } from '../services/apiService';
import { useStore } from '../store/useStore';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [user, setUser] = useState<User | null>(null);
  const [likes, setLikes] = useState(comment.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { currentUser } = useStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserById(comment.userId);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
    setIsLiked(currentUser ? comment.likedBy.includes(currentUser.id) : false);
  }, [comment.userId, comment.likedBy, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;
    
    setIsAnimating(true);
    try {
      const result = await likeComment(comment.id, currentUser.id);
      setLikes(result.likes);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <>
      <div className="comment-item fade-in">
        <img
          src={user?.avatar || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('user avatar')}&image_size=square`}
          alt={user?.nickname || '用户'}
          className="comment-avatar"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('default avatar')}&image_size=square`;
          }}
        />
        <div className="comment-content-wrapper">
          <div className="comment-header">
            <span className="comment-author">{user?.nickname || '匿名用户'}</span>
            <span className="comment-time">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: zhCN })}
            </span>
          </div>
          <p className="comment-text">{comment.content}</p>
          <div className="comment-actions">
            <button
              className={`like-btn ${isLiked ? 'liked' : ''} ${isAnimating ? 'animating' : ''}`}
              onClick={handleLike}
              disabled={!currentUser}
            >
              <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} />
              <span>{likes}</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .comment-item {
          display: flex;
          gap: 12px;
          padding: 16px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .comment-item:last-child {
          border-bottom: none;
        }
        
        .comment-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        
        .comment-content-wrapper {
          flex: 1;
          min-width: 0;
        }
        
        .comment-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        
        .comment-author {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        
        .comment-time {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .comment-text {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 8px;
          word-break: break-word;
        }
        
        .comment-actions {
          display: flex;
          gap: 16px;
        }
        
        .like-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        
        .like-btn:hover:not(:disabled) {
          background: #fef2f2;
          color: #ef4444;
        }
        
        .like-btn.liked {
          color: #ef4444;
        }
        
        .like-btn.animating {
          animation: pulse 0.2s ease;
        }
        
        .like-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </>
  );
};

export default CommentItem;
