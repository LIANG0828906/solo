import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Task, CreateTaskData, TaskStatus, TaskPriority } from './types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskData) => Promise<void>;
  initialStatus: TaskStatus;
  editTask?: Task | null;
}

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialStatus,
  editTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setAssignee(editTask.assignee);
      setPriority(editTask.priority);
      setDueDate(editTask.dueDate);
      setStatus(editTask.status);
    } else {
      setTitle('');
      setDescription('');
      setAssignee('');
      setPriority('medium');
      setDueDate('');
      setStatus(initialStatus);
    }
    setError(null);
  }, [editTask, initialStatus, isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [onClose, isLoading]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!title.trim()) {
        setError('请输入任务标题');
        return;
      }
      if (!assignee.trim()) {
        setError('请输入负责人');
        return;
      }

      setIsLoading(true);
      try {
        await onSubmit({
          title: title.trim(),
          description: description.trim(),
          assignee: assignee.trim(),
          priority,
          dueDate,
          status,
        });
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '提交失败，请重试');
      } finally {
        setIsLoading(false);
      }
    },
    [title, description, assignee, priority, dueDate, status, onSubmit, handleClose]
  );

  if (!isOpen) return null;

  return (
    <div className="task-form-overlay" onClick={handleOverlayClick}>
      <div className="task-form-container" onClick={(e) => e.stopPropagation()}>
        <div className="task-form-header">
          <h3>{editTask ? '编辑任务' : '添加任务'}</h3>
          <button className="close-btn" onClick={handleClose} disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>任务标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入任务描述"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>负责人 *</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="负责人姓名"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>优先级</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isLoading}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>截止日期</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={isLoading}
              >
                <option value="todo">待办</option>
                <option value="inProgress">进行中</option>
                <option value="done">已完成</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="btn-loading"></span>
                  提交中...
                </>
              ) : (
                <>{editTask ? '保存' : '创建'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
