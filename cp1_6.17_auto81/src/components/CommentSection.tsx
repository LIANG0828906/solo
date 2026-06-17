import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { usePaletteStore } from '../store/usePaletteStore';
import { getRelativeTime } from '../utils/colorUtils';
import type { Comment } from '../types';
import './CommentSection.css';

interface CommentSectionProps {
  paletteId: string;
}

export function CommentSection({ paletteId }: CommentSectionProps) {
  const { getCommentsByPaletteId, addComment, currentUser } = usePaletteStore();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setComments(getCommentsByPaletteId(paletteId));
  }, [paletteId, getCommentsByPaletteId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setComments(getCommentsByPaletteId(paletteId));
    }, 60000);
    return () => clearInterval(interval);
  }, [paletteId, getCommentsByPaletteId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment(paletteId, newComment.trim());
    setNewComment('');
    setComments(getCommentsByPaletteId(paletteId));

    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="comment-section">
      <h3 className="section-title">评论 ({comments.length})</h3>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">暂无评论，来说点什么吧～</p>
        ) : (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className="comment-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <img
                src={comment.avatar}
                alt={comment.author}
                className="comment-avatar"
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-time">
                    {getRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      <form className="comment-input-form" onSubmit={handleSubmit}>
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="input-avatar"
        />
        <div className="input-wrapper">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="添加评论..."
            className="comment-input"
          />
          <button
            type="submit"
            className="submit-comment"
            disabled={!newComment.trim()}
            aria-label="发送评论"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
