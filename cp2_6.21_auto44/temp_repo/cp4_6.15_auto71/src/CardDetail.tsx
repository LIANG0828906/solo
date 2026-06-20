import React, { useState, useEffect, useRef } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useBoard } from './App';
import type { Card as CardType, Priority } from './types';
import './CardDetail.css';

interface CardDetailProps {
  card: CardType;
  onClose: () => void;
}

const priorityColors: Record<Priority, string> = {
  high: '#FF6B6B',
  medium: '#FFB74D',
  low: '#69F0AE',
};

const priorityLabels: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const CardDetail: React.FC<CardDetailProps> = ({ card, onClose }) => {
  const { labels, addSubtask, toggleSubtask, addComment } = useBoard();
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(card.id, newSubtask.trim());
    setNewSubtask('');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const author = commentAuthor.trim() || '匿名用户';
    addComment(card.id, author, newComment.trim());
    setNewComment('');
  };

  const getLabelColor = (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    return label?.color || '#6C63FF';
  };

  const getLabelName = (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    return label?.name || '未知';
  };

  const getAvatarColor = (name: string): string => {
    const colors = ['#6C63FF', '#00D9FF', '#FF6B9D', '#4ADE80', '#FBBF24', '#A78BFA'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const completedSubtasks = card.subtasks.filter(s => s.completed).length;
  const totalSubtasks = card.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="detail-panel glass-effect"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-header">
          <div className="detail-priority">
            <span
              className="detail-priority-dot"
              style={{ backgroundColor: priorityColors[card.priority] }}
            />
            <span style={{ color: priorityColors[card.priority] }}>
              {priorityLabels[card.priority]}
            </span>
          </div>
          <button className="detail-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 className="detail-title">{card.title}</h2>

        {card.description && (
          <div className="detail-section">
            <h3 className="detail-section-title">描述</h3>
            <p className="detail-description">{card.description}</p>
          </div>
        )}

        {card.labels.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title">标签</h3>
            <div className="detail-labels">
              {card.labels.map(labelId => (
                <span
                  key={labelId}
                  className="detail-label-pill"
                  style={{
                    backgroundColor: `${getLabelColor(labelId)}20`,
                    color: getLabelColor(labelId),
                    borderColor: getLabelColor(labelId),
                  }}
                >
                  {getLabelName(labelId)}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.dueDate && (
          <div className="detail-section">
            <h3 className="detail-section-title">截止日期</h3>
            <div className="detail-due-date">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span>{format(new Date(card.dueDate), 'yyyy年M月d日', { locale: zhCN })}</span>
            </div>
          </div>
        )}

        <div className="detail-section">
          <div className="detail-section-header">
            <h3 className="detail-section-title">子任务</h3>
            <span className="detail-subtask-count">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          
          {totalSubtasks > 0 && (
            <div className="detail-progress-bar">
              <div
                className="detail-progress-fill"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          )}

          <div className="detail-subtask-list">
            {card.subtasks.map(subtask => (
              <div
                key={subtask.id}
                className={`detail-subtask-item ${subtask.completed ? 'completed' : ''}`}
                onClick={() => toggleSubtask(card.id, subtask.id)}
              >
                <div className={`detail-checkbox ${subtask.completed ? 'checked' : ''}`}>
                  {subtask.completed && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span className="detail-subtask-text">{subtask.title}</span>
              </div>
            ))}
          </div>

          <div className="detail-add-subtask">
            <input
              type="text"
              placeholder="添加子任务..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask();
              }}
              className="detail-input"
            />
            <button
              className="detail-add-btn"
              onClick={handleAddSubtask}
              disabled={!newSubtask.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-header">
            <h3 className="detail-section-title">评论</h3>
            <span className="detail-comment-count">{card.comments.length}</span>
          </div>

          <div className="detail-comment-list">
            {card.comments.length === 0 ? (
              <p className="detail-empty-text">暂无评论，来说点什么吧~</p>
            ) : (
              card.comments.map(comment => (
                <div key={comment.id} className="detail-comment-item">
                  <div
                    className="detail-avatar"
                    style={{ backgroundColor: getAvatarColor(comment.author) }}
                  >
                    {getInitials(comment.author)}
                  </div>
                  <div className="detail-comment-content">
                    <div className="detail-comment-header">
                      <span className="detail-comment-author">{comment.author}</span>
                      <span className="detail-comment-time">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <p className="detail-comment-text">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="detail-add-comment">
            <input
              type="text"
              placeholder="你的名字（可选）"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              className="detail-input detail-author-input"
            />
            <div className="detail-comment-input-wrapper">
              <input
                type="text"
                placeholder="写下你的评论..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment();
                }}
                className="detail-input"
              />
              <button
                className="detail-send-btn"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetail;
