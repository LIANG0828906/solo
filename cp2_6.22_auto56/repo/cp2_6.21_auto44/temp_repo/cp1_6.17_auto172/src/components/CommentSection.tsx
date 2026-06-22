import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Comment, User } from '../types';

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User | null;
  onAddComment: (content: string) => Promise<Comment | null>;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, currentUser, onAddComment }) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting || !currentUser) return;

    setSubmitting(true);
    const result = await onAddComment(newComment.trim());
    if (result) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="comments-section">
      <h3 className="comments-title">
        评论 ({comments.length})
      </h3>
      
      {comments.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">暂无评论</div>
          <div className="empty-state-hint">成为第一个发表评论的人吧</div>
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <img
                src={comment.userAvatar}
                alt={comment.userNickname}
                className="comment-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                }}
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.userNickname}</span>
                  <span className="comment-time">{formatTime(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      )}
      
      {currentUser && (
        <div className="comment-input-wrapper">
          <form className="comment-input" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              placeholder="写下你的评论..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ overflow: 'auto' }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!newComment.trim() || submitting}
              style={{
                opacity: !newComment.trim() || submitting ? 0.5 : 1,
                cursor: !newComment.trim() || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
