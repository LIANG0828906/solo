import { useState, useEffect } from 'react';
import { Comment, addComment, fetchComments } from '../api';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CommentListProps {
  recipeId: string;
}

const EMOJIS = ['😀', '😍', '🤤', '👍', '👏', '🔥', '💯', '✨', '😊', '🙌', '😋', '🥰'];

export default function CommentList({ recipeId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadComments();
  }, [recipeId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await fetchComments(recipeId);
      setComments(data);
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim() && rating === 0) return;

    try {
      setSubmitting(true);
      const comment = await addComment({
        recipeId,
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar,
        content: newComment.trim(),
        rating
      });
      setComments([comment, ...comments]);
      setNewComment('');
      setRating(0);
    } catch (error) {
      console.error('发表评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmoji(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="comments-section" id="comments">
      <h3>评论 ({comments.length})</h3>

      {user ? (
        <div className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="分享你的烹饪心得..."
          />
          <div className="comment-form-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`rating-star ${(hoverRating || rating) >= star ? 'active' : ''}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="emoji-picker">
                <button
                  type="button"
                  className="emoji-btn"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  😊
                </button>
                {showEmoji && (
                  <div className="emoji-list">
                    {EMOJIS.map((emoji, index) => (
                      <span
                        key={index}
                        className="emoji-item"
                        onClick={() => handleEmojiClick(emoji)}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || (!newComment.trim() && rating === 0)}
            >
              {submitting ? '发送中...' : '发表评论'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg)',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '12px' }}>
            登录后即可发表评论
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/login')}
          >
            去登录
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>加载评论中...</span>
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-light)' }}>
          暂无评论，来抢沙发吧~
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <img
                  src={comment.userAvatar}
                  alt={comment.username}
                  className="comment-avatar"
                />
                <div className="comment-info">
                  <div className="comment-username">{comment.username}</div>
                  <div className="comment-time">{formatTime(comment.createdAt)}</div>
                </div>
                {comment.rating > 0 && (
                  <div className="comment-rating">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`star ${i < comment.rating ? 'filled' : ''}`}
                        style={{ fontSize: '14px' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {comment.content && (
                <div className="comment-content">{comment.content}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
