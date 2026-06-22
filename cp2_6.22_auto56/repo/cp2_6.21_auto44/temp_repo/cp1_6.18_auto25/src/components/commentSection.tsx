import React, { useState } from 'react';
import { Comment } from '@/api/recipes';
import { formatRelativeTime } from '@/utils/time';

interface CommentSectionProps {
  comments: Comment[];
  recipeId: string;
  onAddComment: (recipeId: string, content: string, user: string) => Promise<void>;
  onToggleLike: (recipeId: string, commentId: string) => Promise<void>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  recipeId,
  onAddComment,
  onToggleLike,
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    await onAddComment(recipeId, newComment.trim(), '访客用户');
    setNewComment('');
    setSubmitting(false);
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);
    await onAddComment(recipeId, `回复: ${replyContent.trim()}`, '访客用户');
    setReplyContent('');
    setReplyToId(null);
    setSubmitting(false);
  };

  const sortedComments = [...comments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="comment-section">
      <h3 className="comment-title">互动评论</h3>

      <div className="comment-input-wrap">
        <textarea
          className="comment-input"
          placeholder="写下你的评论..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <button
          className="comment-submit-btn"
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
        >
          发表评论
        </button>
      </div>

      <div className="comment-list">
        {sortedComments.length === 0 ? (
          <div className="empty-comments">
            <p>暂无评论，来发布第一条评论吧～</p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar" style={{ backgroundColor: '#E8D5C4' }}>
                {comment.avatar}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-user">{comment.user}</span>
                  <span className="comment-timestamp">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-actions">
                  <button
                    className={`like-btn ${comment.liked ? 'liked' : ''}`}
                    onClick={() => onToggleLike(recipeId, comment.id)}
                  >
                    <span className="heart-icon">{comment.liked ? '♥' : '♡'}</span>
                    <span className="like-count">{comment.likes > 0 ? comment.likes : ''}</span>
                  </button>
                  <button
                    className="reply-btn"
                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                  >
                    回复
                  </button>
                </div>
                {replyToId === comment.id && (
                  <div className="reply-input-wrap">
                    <input
                      type="text"
                      className="reply-input"
                      placeholder="写下你的回复..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <button
                      className="reply-submit-btn"
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={!replyContent.trim()}
                    >
                      发送
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
