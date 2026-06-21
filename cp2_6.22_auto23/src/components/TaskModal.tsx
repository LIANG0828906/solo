import React, { useState, useEffect } from 'react';
import { Task, Priority, TaskStatus, STATUS_LABELS } from '../types';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('');
  const [storyPoints, setStoryPoints] = useState(1);
  const [status, setStatus] = useState<TaskStatus>('todo');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setAssignee(task.assignee);
      setStoryPoints(task.storyPoints);
      setStatus(task.status);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignee('');
      setStoryPoints(1);
      setStatus('todo');
    }
  }, [task]);

  const handleSave = () => {
    onSave({
      id: task?.id,
      title,
      description,
      priority,
      assignee,
      storyPoints,
      status,
    });
    onClose();
  };

  const handleDelete = () => {
    if (task && window.confirm('确定要删除这个任务吗？')) {
      onDelete(task.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? '编辑任务' : '新建任务'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">任务标题</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入任务标题"
            />
          </div>
          <div className="form-group">
            <label className="form-label">任务描述</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入任务描述"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">优先级</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">负责人</label>
              <input
                type="text"
                className="form-input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="负责人姓名"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">故事点数</label>
              <input
                type="number"
                className="form-input"
                value={storyPoints}
                onChange={(e) => setStoryPoints(Number(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div className="form-group">
              <label className="form-label">状态</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {task && (
            <button className="btn" style={{ color: '#e74c3c', marginRight: 'auto' }} onClick={handleDelete}>
              删除
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
