import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { addComment, updateTask } from '../api';
import type { Task, TaskStatus } from '../types';
import { PRIORITY_COLORS, TAG_COLORS, STATUS_META } from '../types';

interface CardDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
}

function formatDateTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDescription(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(?:^|\n)- (.+)/g, '<li>$1</li>')
    .replace(/(?:^|\n)\d+\. (.+)/g, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
}

export default function CardDetailModal({
  task,
  onClose,
  onTaskUpdated,
}: CardDetailModalProps) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setComment('');
  }, [task?.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.comments.length]);

  if (!task) return null;

  const sortedComments = [...task.comments].sort((a, b) => b.createdAt - a.createdAt);

  const handleSubmitComment = async () => {
    const content = comment.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      const updated = await addComment(task.id, content);
      onTaskUpdated(updated);
      setComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    try {
      const updated = await updateTask(task.id, { status });
      onTaskUpdated(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <Modal isOpen={!!task} onClose={onClose} title={task.title}>
      <div className="modal-body">
        <div className="detail-section">
          <div className="detail-label">优先级</div>
          <span
            className="card-priority"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          >
            {task.priority}
          </span>
        </div>

        <div className="detail-section">
          <div className="detail-label">状态</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="secondary"
                style={{
                  backgroundColor: task.status === s ? STATUS_META[s].color : undefined,
                  color: task.status === s ? 'white' : undefined,
                }}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="detail-section">
            <div className="detail-label">标签</div>
            <div className="detail-tags">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="card-tag"
                  style={{ backgroundColor: TAG_COLORS[tag] }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {task.description && (
          <div className="detail-section">
            <div className="detail-label">描述</div>
            <div
              className="detail-description"
              dangerouslySetInnerHTML={{ __html: formatDescription(task.description) }}
            />
          </div>
        )}

        <div className="detail-section">
          <div className="detail-label">创建信息</div>
          <div className="detail-meta">
            <div className="detail-meta-item">
              <span>创建时间：</span>
              <span>{formatDateTime(task.createdAt)}</span>
            </div>
            <div className="detail-meta-item">
              <span>状态更新于：</span>
              <span>{formatDateTime(task.statusChangedAt)}</span>
            </div>
          </div>
        </div>

        <div className="comments-section">
          <div className="detail-label" style={{ marginBottom: '12px' }}>
            评论 ({task.comments.length})
          </div>
          <div className="comments-list">
            {sortedComments.length === 0 ? (
              <div style={{ color: '#bbb', fontSize: '13px', padding: '12px 0' }}>
                暂无评论
              </div>
            ) : (
              sortedComments.map((c) => (
                <div key={c.id} className="comment">
                  <div className="comment-content">{c.content}</div>
                  <div className="comment-time">{formatDateTime(c.createdAt)}</div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
          <textarea
            className="comment-input"
            placeholder="写下你的评论..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <div className="comment-input-hint">按 Ctrl + Enter 提交</div>
            <button
              onClick={handleSubmitComment}
              disabled={!comment.trim() || submitting}
              style={{
                opacity: !comment.trim() || submitting ? 0.5 : 1,
                cursor: !comment.trim() || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
