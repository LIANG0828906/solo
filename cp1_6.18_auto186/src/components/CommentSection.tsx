import { useState, useEffect } from 'react';
import type { Comment } from '../data/photoStore';

interface Props {
  photoId: string;
  onSubmitSuccess?: () => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const avatarColors = [
  '#D4AF37', '#2C3E50', '#E74C3C', '#3498DB', '#27AE60', '#8E44AD', '#E67E22'
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

export default function CommentSection({ photoId, onSubmitSuccess }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    const res = await fetch(`/api/comments?photoId=${photoId}`);
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => {
    loadComments();
  }, [photoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('请填写您的称呼');
      return;
    }
    if (!content.trim()) {
      setError('请填写评论内容');
      return;
    }
    if (content.length > 200) {
      setError('评论不能超过200字');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, username: username.trim(), content: content.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setUsername('');
        setContent('');
        await loadComments();
        onSubmitSuccess?.();
      } else {
        setError(data.error || '评论失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comments-section">
      <h3 className="comments-title">评论 ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-inputs">
          <input
            type="text"
            className="input-field"
            placeholder="您的称呼"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <textarea
            className="input-field"
            placeholder="写下您的感受（最多200字）..."
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={200}
            style={{ resize: 'vertical' }}
          />
          <div className="comment-footer">
            <span className="char-count">{content.length}/200</span>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '发送中...' : '发表评论'}
            </button>
          </div>
          {error && <p className="comment-error">{error}</p>}
        </div>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="comments-empty">暂无评论，来发表第一条评论吧~</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="comment-item fade-in">
              <div
                className="comment-avatar"
                style={{ backgroundColor: getAvatarColor(c.username) }}
              >
                {c.username.charAt(0).toUpperCase()}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-username">{c.username}</span>
                  <span className="comment-time">{formatDate(c.createdAt)}</span>
                </div>
                <p className="comment-text">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .comments-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--color-border);
        }
        .comments-title {
          font-size: 20px;
          margin-bottom: 16px;
        }
        .comment-form {
          margin-bottom: 24px;
        }
        .comment-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        .char-count {
          font-size: 12px;
          color: #999;
        }
        .comment-error {
          color: #e74c3c;
          font-size: 13px;
          margin-top: 8px;
        }
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .comment-item {
          display: flex;
          gap: 12px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: var(--radius-md);
        }
        .comment-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }
        .comment-content {
          flex: 1;
          min-width: 0;
        }
        .comment-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        .comment-username {
          font-weight: 600;
          font-size: 14px;
          color: var(--color-primary);
        }
        .comment-time {
          font-size: 12px;
          color: #999;
        }
        .comment-text {
          font-size: 14px;
          color: #555;
          line-height: 1.6;
          word-wrap: break-word;
        }
        .comments-empty {
          text-align: center;
          color: #999;
          padding: 24px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
