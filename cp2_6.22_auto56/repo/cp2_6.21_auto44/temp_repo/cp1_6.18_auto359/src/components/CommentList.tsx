import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Send } from 'lucide-react';
import { useStore } from '@/store';
import { api } from '@/api';
import { getInitials } from '@/utils/colors';
import { formatDate } from '@/utils/date';
import type { Comment, User } from '@/types';

interface CommentListProps {
  taskId: string;
}

export function CommentList({ taskId }: CommentListProps) {
  const { comments, fetchComments, addComment, user } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [users, setUsers] = useState<Record<string, User>>({});
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetchComments(taskId);
  }, [taskId, fetchComments]);

  useEffect(() => {
    const taskComments = comments[taskId] || [];
    const userIds = [...new Set(taskComments.map((c) => c.userId))];
    userIds.forEach(async (id) => {
      if (!users[id]) {
        const u = await api.getUser(id);
        if (u) {
          setUsers((prev) => ({ ...prev, [id]: u }));
        }
      }
    });
  }, [comments, taskId]);

  const taskComments = comments[taskId] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    await addComment(taskId, newComment.trim(), user.id);
    setNewComment('');
    setPreview(false);
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setNewComment('');
      setPreview(false);
    }
  };

  return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
      <button
        type="button"
        onClick={toggleForm}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          padding: '4px 0',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
      >
        <MessageCircle size={14} />
        <span>评论 ({taskComments.length})</span>
      </button>

      {showForm && (
        <div className="animate-fade-in" style={{ marginTop: '12px' }}>
          {taskComments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              {taskComments.map((comment: Comment) => {
                const commentUser = users[comment.userId];
                return (
                  <div key={comment.id} style={{ display: 'flex', gap: '10px', animation: 'fadeIn 0.3s ease' }}>
                    <div
                      className="avatar"
                      style={{
                        width: '36px',
                        height: '36px',
                        background: commentUser?.avatarGradient || '#ccc',
                      }}
                    >
                      {getInitials(commentUser?.nickname || '?')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {commentUser?.nickname || '未知用户'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <div className="markdown-preview" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                      <ReactMarkdown>{comment.content}</ReactMarkdown>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <textarea
                className="textarea"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="支持 Markdown：**粗体**、*斜体*、[链接](url)"
                style={{ fontSize: '13px', minHeight: '60px' }}
              />
              {preview && newComment && (
                <div
                  className="markdown-preview"
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: '#F8F9FA',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  <ReactMarkdown>{newComment}</ReactMarkdown>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={preview}
                  onChange={(e) => setPreview(e.target.checked)}
                  style={{ margin: 0 }}
                />
                预览
              </label>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '6px 12px', minHeight: 'auto', fontSize: '12px' }}
                onClick={() => {
                  setNewComment('');
                  setPreview(false);
                }}
              >
                清空
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newComment.trim()}
                style={{ padding: '6px 16px', minHeight: 'auto', fontSize: '12px' }}
              >
                <Send size={14} />
                发送
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
