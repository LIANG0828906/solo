import { useState } from 'react';
import type { Annotation, User } from '../utils/annotationStore';
import { store } from '../utils/annotationStore';

interface AnnotationBubbleProps {
  annotation: Annotation;
  users: User[];
  onHeightChange?: () => void;
}

const formatTime = (d: Date): string => {
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)} 天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const getInitial = (name: string): string => {
  return name ? name.slice(0, 1) : '?';
};

const getUser = (users: User[], id: string): User | undefined =>
  users.find(u => u.id === id);

const IconReply = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"></polyline>
    <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const IconReopen = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"></polyline>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
  </svg>
);

export function AnnotationBubble({ annotation, users, onHeightChange }: AnnotationBubbleProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const author = getUser(users, annotation.authorId);

  const handleToggleResolved = () => {
    store.toggleResolved(annotation.id);
    setTimeout(() => onHeightChange?.(), 50);
  };

  const handleSubmitReply = () => {
    const text = replyText.trim();
    if (!text) return;
    store.addReply(annotation.id, text);
    setReplyText('');
    setShowReplyInput(false);
    setTimeout(() => onHeightChange?.(), 50);
  };

  return (
    <div className={`bubble ${annotation.isResolved ? 'resolved' : ''}`}>
      <div className="bubble-header">
        <div className="bubble-author">
          {author && (
            <div className="author-avatar" style={{ background: author.avatarColor }}>
              {getInitial(author.name)}
            </div>
          )}
          <div className="author-meta">
            <span className="author-name">{author?.name ?? '未知用户'}</span>
            <span className="author-time">{formatTime(annotation.createdAt)}</span>
          </div>
        </div>
        <div className="bubble-actions">
          <button
            className="mini-btn"
            title="回复"
            onClick={() => setShowReplyInput(s => !s)}
          >
            <IconReply />
          </button>
          {annotation.isResolved ? (
            <button
              className="mini-btn reopen"
              title="重新打开"
              onClick={handleToggleResolved}
            >
              <IconReopen />
            </button>
          ) : (
            <button
              className="mini-btn resolve"
              title="标记已解决"
              onClick={handleToggleResolved}
            >
              <IconCheck />
            </button>
          )}
        </div>
      </div>

      <span className={`bubble-tag ${annotation.isResolved ? 'resolved' : 'open'}`}>
        {annotation.isResolved ? (
          <><IconCheck /> 已解决</>
        ) : (
          <span>● 讨论中</span>
        )}
      </span>

      <div className="bubble-quote" title={annotation.selectedText}>
        「{annotation.selectedText}」
      </div>

      <div className="bubble-content">{annotation.content}</div>

      {annotation.replies.length > 0 && (
        <div className="replies-list">
          {annotation.replies.map(r => {
            const ru = getUser(users, r.authorId);
            return (
              <div key={r.id} className="reply-item">
                <div
                  className="reply-avatar"
                  style={{ background: ru?.avatarColor ?? '#ccc' }}
                >
                  {ru ? getInitial(ru.name) : '?'}
                </div>
                <div className="reply-body">
                  <div className="reply-head">
                    <span className="reply-author">{ru?.name ?? '未知'}</span>
                    <span className="reply-time">{formatTime(r.createdAt)}</span>
                  </div>
                  <div className="reply-text">{r.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showReplyInput && (
        <div className="reply-input-wrap">
          <textarea
            className="reply-input"
            placeholder="输入回复内容…"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitReply();
            }}
            autoFocus
          />
          <div className="reply-send-row">
            <button className="btn btn-ghost" onClick={() => { setShowReplyInput(false); setReplyText(''); }}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSubmitReply} disabled={!replyText.trim()}>
              回复
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
