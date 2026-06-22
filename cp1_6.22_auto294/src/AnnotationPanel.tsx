import React, { useState, memo } from 'react';
import type { Annotation, Reply } from './types';

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

interface AnnotationItemProps {
  annotation: Annotation;
  currentUserId: string;
  onLike: (id: string) => void;
  onAddReply: (annotationId: string, content: string) => void;
}

const AnnotationItem: React.FC<AnnotationItemProps> = memo(({
  annotation,
  currentUserId,
  onLike,
  onAddReply,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isScaling, setIsScaling] = useState(false);

  const isLiked = annotation.likedBy.includes(currentUserId);

  const handleLike = () => {
    setIsScaling(true);
    onLike(annotation.id);
    setTimeout(() => setIsScaling(false), 200);
  };

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onAddReply(annotation.id, replyContent.trim());
      setReplyContent('');
    }
  };

  return (
    <div className="annotation-bubble">
      <div className="annotation-header">
        <span className="annotation-author">{annotation.userName}</span>
        <span className="annotation-time">{formatTime(annotation.createdAt)}</span>
      </div>
      <div className="annotation-content">{annotation.content}</div>
      <div className="annotation-actions">
        <button
          className={`action-btn like-btn ${isLiked ? 'liked' : ''} ${isScaling ? 'scale' : ''}`}
          onClick={handleLike}
        >
          <span>👍</span>
          <span>{annotation.likes}</span>
        </button>
        <button
          className="action-btn"
          onClick={() => setShowReplies(!showReplies)}
        >
          <span>💬</span>
          <span>{annotation.replies.length}</span>
        </button>
      </div>
      {showReplies && (
        <div className="replies-section">
          {annotation.replies.length > 0 && (
            <div className="replies-list">
              {annotation.replies.map((reply: Reply) => (
                <div key={reply.id} className="reply-item">
                  <div className="reply-header">
                    {reply.userName} · {formatTime(reply.createdAt)}
                  </div>
                  <div className="reply-content">{reply.content}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <input
              type="text"
              className="reply-input"
              placeholder="写下你的回复..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitReply();
              }}
              maxLength={200}
            />
            <button
              className="action-btn"
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
              style={{ opacity: replyContent.trim() ? 1 : 0.5 }}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

AnnotationItem.displayName = 'AnnotationItem';

export default AnnotationItem;
