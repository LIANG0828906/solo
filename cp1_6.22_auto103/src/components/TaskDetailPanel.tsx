import React, { useState, useRef, useEffect } from 'react';
import { Task, Comment } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: '#888' },
  'in-progress': { label: '进行中', color: '#4A9EFF' },
  done: { label: '已完成', color: '#00D4AA' },
};

interface Props {
  task: Task;
  boardId: string;
  onClose: () => void;
  onAddComment: (content: string) => void;
}

export default function TaskDetailPanel({ task, boardId, onClose, onAddComment }: Props) {
  const [commentText, setCommentText] = useState('');
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const charCount = commentText.length;
  const maxChars = 200;

  const handleSubmit = () => {
    if (!commentText.trim() || charCount > maxChars) return;
    onAddComment(commentText.trim());
    setCommentText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  useEffect(() => {
    if (task.comments.length > 0) {
      const last = task.comments[task.comments.length - 1];
      setAnimatingId(last.id);
      const timer = setTimeout(() => setAnimatingId(null), 500);
      return () => clearTimeout(timer);
    }
  }, [task.comments.length]);

  const sortedComments = [...task.comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999,
        }}
      />
      <div className="task-detail-panel" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '90vw',
        background: 'rgba(42, 42, 62, 0.85)', backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.3s cubic-bezier(0.2, 0, 0, 1)',
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0.3; transform: scale(0.8); }
          }
        `}</style>

        <div style={{
          padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 17, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</h3>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 12,
              fontSize: 12, fontWeight: 600, color: '#fff',
              background: statusCfg.color + '33', border: `1px solid ${statusCfg.color}66`,
            }}>
              {statusCfg.label}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#888', fontSize: 22,
              cursor: 'pointer', padding: '0 4px', lineHeight: 1, transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; }}
          >
            ×
          </button>
        </div>

        {task.description && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>{task.description}</p>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
            评论 ({task.comments.length})
          </div>
          {sortedComments.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: '#555', fontSize: 13 }}>
              暂无评论，来添加第一条吧
            </div>
          )}
          {sortedComments.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex', gap: 10, marginBottom: 14,
                animation: c.id === animatingId ? 'fadeIn 0.4s ease-out' : 'none',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: c.avatarColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#fff', fontWeight: 600, flexShrink: 0,
              }}>
                {c.username[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#ddd', fontWeight: 600 }}>{c.username}</span>
                  <span style={{ fontSize: 11, color: '#666' }}>{formatTime(c.createdAt)}</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '10px 14px',
                  fontSize: 13, color: '#ddd', lineHeight: 1.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }}>
                  {c.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        <div style={{
          padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, maxChars))}
              onKeyDown={handleKeyDown}
              placeholder="输入评论... (Ctrl+Enter 发送)"
              style={{
                width: '100%', background: '#25253A', border: `1px solid ${charCount >= maxChars ? '#FF6B6B' : '#444'}`,
                borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13,
                outline: 'none', minHeight: 44, maxHeight: 100, resize: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                if (charCount < maxChars) {
                  e.currentTarget.style.borderColor = '#00D4AA';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,212,170,0.15)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#444';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
            }}>
              <span style={{ fontSize: 11, color: charCount >= maxChars ? '#FF6B6B' : '#555' }}>
                {charCount}/{maxChars}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!commentText.trim() || charCount > maxChars}
                style={{
                  background: commentText.trim() && charCount <= maxChars ? '#00D4AA' : '#333',
                  border: 'none', color: commentText.trim() && charCount <= maxChars ? '#1E1E2E' : '#666',
                  borderRadius: 8, padding: '6px 18px', fontSize: 13, fontWeight: 600,
                  cursor: commentText.trim() && charCount <= maxChars ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
