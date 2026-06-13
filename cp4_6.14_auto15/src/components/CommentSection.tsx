import { useState, useEffect, useRef } from 'react';
import { getComments, postComment } from '../utils/api';
import { useStore } from '../store/useStore';
import { formatDate, randomAvatarColor } from '../utils/helpers';
import type { Comment } from '../types';

interface CommentSectionProps {
  recipeId: string;
}

export default function CommentSection({ recipeId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const { showToast } = useStore();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getComments(recipeId);
        setComments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [recipeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { showToast('请输入昵称', 'error'); return; }
    if (!content.trim()) { showToast('请输入评论内容', 'error'); return; }
    setSubmitting(true);
    try {
      const newComment = await postComment(recipeId, { username: username.trim(), content: content.trim() });
      setComments((prev) => [newComment, ...prev]);
      setNewIds((prev) => new Set(prev).add(newComment.id));
      setUsername('');
      setContent('');
      showToast('评论发布成功！', 'success');
      setTimeout(() => {
        setNewIds((prev) => {
          const n = new Set(prev);
          n.delete(newComment.id);
          return n;
        });
      }, 800);
    } catch (err) {
      showToast('评论发布失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
        💬 评论区 <span style={{ fontSize: 14, color: 'var(--text-light)', fontWeight: 400 }}>({comments.length})</span>
      </h3>

      <form onSubmit={handleSubmit} style={{ marginBottom: 28, padding: 20, background: 'rgba(255,111,0,0.04)', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="你的昵称"
            style={{
              flex: 1, minWidth: 160, height: 44, borderRadius: 10, border: '1px solid #eee',
              padding: '0 14px', fontSize: 14, background: '#fff',
            }}
          />
        </div>
        <textarea
          value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="分享你对这道菜的想法..."
          rows={3}
          style={{
            width: '100%', borderRadius: 10, border: '1px solid #eee',
            padding: 14, fontSize: 14, resize: 'vertical', background: '#fff',
            fontFamily: 'inherit', marginBottom: 12,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit" disabled={submitting}
            style={{
              padding: '10px 28px', borderRadius: 22, fontWeight: 600, fontSize: 14,
              background: 'var(--primary)', color: 'white',
              boxShadow: '0 4px 12px rgba(255,111,0,0.3)',
              opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '发布中...' : '发布评论'}
          </button>
        </div>
      </form>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                <div className="skeleton" style={{ height: 16, width: '30%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📝</div>
          <p>暂无评论，快来抢沙发！</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              className={newIds.has(c.id) ? 'slide-up' : ''}
              style={{ display: 'flex', gap: 14 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: c.avatarColor, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16,
              }}>
                {getInitial(c.username)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{c.username}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{formatDate(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
