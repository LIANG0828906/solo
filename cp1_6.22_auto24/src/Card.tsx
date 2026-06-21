import React, { useState, useCallback } from 'react';
import { Edit2, Trash2, X, Calendar, User, Flag } from 'lucide-react';
import type { Task } from './types';

interface CardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const statusLabels: Record<string, string> = {
  todo: '待办',
  inProgress: '进行中',
  done: '已完成',
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '未设置';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const Card: React.FC<CardProps> = ({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(task);
    },
    [onEdit, task]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(`确定要删除任务"${task.title}"吗？`)) {
        onDelete(task.id);
      }
    },
    [onDelete, task]
  );

  const handleCardClick = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleCloseModal();
      }
    },
    [handleCloseModal]
  );

  return (
    <>
      <div
        className={`task-card ${isDragging ? 'dragging' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onDragEnd={onDragEnd}
        onClick={handleCardClick}
      >
        <div className="task-card-header">
          <div className="task-card-title">{task.title}</div>
          <div className="task-actions">
            <button
              className="task-action-btn edit"
              onClick={handleEditClick}
              title="编辑"
            >
              <Edit2 size={14} />
            </button>
            <button
              className="task-action-btn delete"
              onClick={handleDeleteClick}
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="task-meta">
          <span className={`task-priority priority-${task.priority}`}>
            {priorityLabels[task.priority]}
          </span>
          <div className="task-assignee">
            <div className="avatar">{getInitials(task.assignee)}</div>
            <span>{task.assignee}</span>
          </div>
        </div>

        {task.dueDate && (
          <div className="task-due-date">
            <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {formatDate(task.dueDate)}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{task.title}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail">
                <div className="modal-detail-label">描述</div>
                <div className="modal-detail-value">
                  {task.description || '暂无描述'}
                </div>
              </div>

              <div className="modal-detail-row">
                <div className="modal-detail">
                  <div className="modal-detail-label">
                    <Flag size={12} style={{ marginRight: '4px' }} />
                    优先级
                  </div>
                  <div className="modal-detail-value">
                    <span className={`task-priority priority-${task.priority}`}>
                      {priorityLabels[task.priority]}
                    </span>
                  </div>
                </div>
                <div className="modal-detail">
                  <div className="modal-detail-label">状态</div>
                  <div className="modal-detail-value">
                    {statusLabels[task.status]}
                  </div>
                </div>
              </div>

              <div className="modal-detail-row">
                <div className="modal-detail">
                  <div className="modal-detail-label">
                    <User size={12} style={{ marginRight: '4px' }} />
                    负责人
                  </div>
                  <div className="modal-detail-value">
                    <div className="task-assignee">
                      <div className="avatar">{getInitials(task.assignee)}</div>
                      <span>{task.assignee}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-detail">
                  <div className="modal-detail-label">
                    <Calendar size={12} style={{ marginRight: '4px' }} />
                    截止日期
                  </div>
                  <div className="modal-detail-value">
                    {formatDate(task.dueDate)}
                  </div>
                </div>
              </div>

              <div className="modal-detail">
                <div className="modal-detail-label">创建时间</div>
                <div className="modal-detail-value">
                  {new Date(task.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Card;
