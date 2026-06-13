import { useState, memo, useMemo } from 'react';
import { Send, User } from 'lucide-react';
import type { Comment } from '@/data/mockData';
import { formatDate, MAX_COMMENT_LENGTH } from '@/data/mockData';

interface CommentSectionProps {
  comments: Comment[];
  onSubmit: (data: { username: string; content: string }) => void;
}

interface CommentItemProps {
  comment: Comment;
  isNew?: boolean;
}

const CommentItem = memo(function CommentItem({ comment, isNew }: CommentItemProps) {
  return (
    <div className={`comment-item ${isNew ? 'comment-item--new' : ''}`}>
      <div className="comment-item__avatar">
        <User size={18} strokeWidth={1.5} />
      </div>
      <div className="comment-item__body">
        <div className="comment-item__header">
          <span className="comment-item__username">{comment.username}</span>
          <span className="comment-item__time">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="comment-item__content">{comment.content}</p>
      </div>
    </div>
  );
});

export function CommentSection({ comments, onSubmit }: CommentSectionProps) {
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [newestId, setNewestId] = useState<string | null>(null);

  const sortedComments = useMemo(() => {
    return comments
      .map((c) => ({ ...c }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedContent = content.trim();
    if (!trimmedUsername || !trimmedContent) return;

    onSubmit({ username: trimmedUsername, content: trimmedContent });
    setContent('');
    setTimeout(() => setNewestId(null), 1500);
  };

  const newestCommentId = sortedComments.length > 0 ? sortedComments[0].id : null;
  if (newestCommentId && newestCommentId !== newestId) {
    queueMicrotask(() => setNewestId(newestCommentId));
  }

  return (
    <div className="comment-section">
      <div className="comment-section__header">
        <h4>评论 <span className="comment-section__count">({sortedComments.length})</span></h4>
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-form__row">
          <input
            type="text"
            className="comment-form__input"
            placeholder="您的称呼"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 20))}
            maxLength={20}
          />
        </div>
        <div className="comment-form__row comment-form__row--submit">
          <textarea
            className="comment-form__textarea"
            placeholder="分享您的感受...（最多100字）"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
          />
          <div className="comment-form__actions">
            <span className={`comment-form__counter ${content.length >= MAX_COMMENT_LENGTH ? 'is-max' : ''}`}>
              {content.length}/{MAX_COMMENT_LENGTH}
            </span>
            <button
              type="submit"
              className="comment-form__submit"
              disabled={!username.trim() || !content.trim()}
            >
              <Send size={16} />
              发表
            </button>
          </div>
        </div>
      </form>

      <div className="comment-list">
        {sortedComments.length === 0 ? (
          <div className="comment-list__empty">
            暂无评论，来做第一位评论者吧~
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isNew={comment.id === newestId}
            />
          ))
        )}
      </div>
    </div>
  );
}
