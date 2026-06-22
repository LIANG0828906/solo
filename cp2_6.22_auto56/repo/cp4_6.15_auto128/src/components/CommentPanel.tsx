import { useState, useRef, useEffect } from 'react';
import { addComment } from '../utils/api';
import type { PublicCardData, Comment } from '../types';
import '../styles/CommentPanel.css';

interface CommentPanelProps {
  card: PublicCardData;
  onClose: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

function formatCommentTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 60000) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const date = new Date(timestamp);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export default function CommentPanel({ card, onClose, onToast }: CommentPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(card.comments);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalComments(card.comments);
  }, [card.comments]);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed || submitting) return;

    if (trimmed.length > 500) {
      onToast('评论最多500个字符', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await addComment(card.id, trimmed);
      setLocalComments((prev) => {
        const exists = prev.some((c) => c.id === result.comment.id);
        return exists ? prev : [result.comment, ...prev];
      });
      setInputValue('');
      onToast('评论成功！');
    } catch (err) {
      onToast(err instanceof Error ? err.message : '评论失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className="comment-backdrop animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="comment-panel animate-slide-in-right"
        ref={panelRef}
      >
        <header className="panel-header">
          <div className="panel-title-section">
            <h2 className="panel-title">
              {card.title}
            </h2>
            <p className="panel-subtitle">
              💬 共 {card.commentCount} 条匿名评论
            </p>
          </div>
          <button
            type="button"
            className="panel-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="关闭评论"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="comments-list" ref={listRef}>
          {localComments.length === 0 ? (
            <div className="comments-empty">
              <div className="empty-bubble">💭</div>
              <p className="empty-title">还没有评论</p>
              <p className="empty-desc">来说说你对这个灵感的看法吧！</p>
            </div>
          ) : (
            localComments.map((comment, index) => (
              <article
                key={comment.id}
                className={`comment-item ${index === 0 && localComments.length !== card.comments.length ? 'is-new' : ''}`}
                style={{
                  animationDelay: `${Math.min(index * 30, 300)}ms`,
                }}
              >
                <div
                  className="comment-avatar"
                  style={{ backgroundColor: comment.color }}
                >
                  <span>{comment.anonymousId}</span>
                </div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span
                      className="comment-author"
                      style={{ color: comment.color }}
                    >
                      匿名用户{comment.anonymousId}
                    </span>
                    <span className="comment-time">
                      {formatCommentTime(comment.timestamp)}
                    </span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              </article>
            ))
          )}
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="form-textarea-wrapper">
            <textarea
              ref={inputRef}
              className="comment-input"
              placeholder="写下你的评论... (Ctrl/⌘+Enter 发送)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              maxLength={500}
              disabled={submitting}
            />
            <span className="input-char-count">
              {inputValue.length}/500
            </span>
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={!inputValue.trim() || submitting}
          >
            {submitting ? (
              <>
                <span className="submit-spinner" />
                发送中
              </>
            ) : (
              <>
                发送
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
