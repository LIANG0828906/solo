import React, { useState, useEffect, useRef } from 'react';
import { Task, Comment } from '../data';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onAddComment: (taskId: string, content: string) => void;
}

const priorityColors: Record<string, string> = {
  high: '#ff4d4f',
  medium: '#faad14',
  low: '#52c41a',
};

const priorityLabels: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const statusLabels: Record<string, string> = {
  todo: '待办',
  'in-progress': '进行中',
  done: '已完成',
};

const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose, onAddComment }) => {
  const [comment, setComment] = useState('');
  const [currentComments, setCurrentComments] = useState<Comment[]>(task.comments);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentComments(task.comments);
  }, [task.comments]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentComments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(task.id, comment.trim());
      setComment('');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content task-detail">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <div className="detail-header">
          <h2 className="detail-title">{task.title}</h2>
          <div className="detail-meta">
            <span
              className="priority-badge"
              style={{ backgroundColor: priorityColors[task.priority] }}
            >
              {priorityLabels[task.priority]}
            </span>
            <span className="status-badge">{statusLabels[task.status]}</span>
          </div>
        </div>

        <div className="detail-info">
          <div className="info-row">
            <span className="info-label">负责人：</span>
            <span
              className="assignee-avatar small"
              style={{
                backgroundColor: task.assignee.charCodeAt(0) % 2 === 0 ? '#1890ff' : '#52c41a',
              }}
            >
              {task.assignee.charAt(0)}
            </span>
            <span className="info-value">{task.assignee}</span>
          </div>
          <div className="info-row">
            <span className="info-label">截止日期：</span>
            <span className="info-value">{task.dueDate}</span>
          </div>
        </div>

        <div className="detail-description">
          <h3 className="section-title">任务描述</h3>
          <p>{task.description}</p>
        </div>

        <div className="comments-section">
          <h3 className="section-title">评论 ({currentComments.length})</h3>
          <div className="comments-list">
            {currentComments.map((c) => (
              <div key={c.id} className="comment-item">
                <span
                  className="comment-avatar"
                  style={{
                    backgroundColor:
                      c.author.charCodeAt(0) % 2 === 0 ? '#1890ff' : '#52c41a',
                  }}
                >
                  {c.author.charAt(0)}
                </span>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">{c.author}</span>
                    <span className="comment-time">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="comment-content">{c.content}</p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          <form className="comment-form" onSubmit={handleSubmit}>
            <textarea
              className="comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="添加评论..."
              rows={3}
            />
            <button type="submit" className="submit-btn" disabled={!comment.trim()}>
              发送
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
