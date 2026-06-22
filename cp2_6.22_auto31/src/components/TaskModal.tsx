import { useState, useEffect } from 'react';
import { Task } from '../types';
import './components.css';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskModal({ task, onClose, onSave, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [assignee, setAssignee] = useState('');
  const [storyPoints, setStoryPoints] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setAssignee(task.assignee);
      setStoryPoints(task.storyPoints);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [task]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (task) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [task, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSave = () => {
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      title,
      description,
      priority,
      assignee,
      storyPoints,
    };

    onSave(updatedTask);
    handleClose();
  };

  const handleDelete = () => {
    if (!task) return;
    if (window.confirm('确定要删除这个任务吗？')) {
      onDelete(task.id);
      handleClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!task && !isVisible) return null;

  return (
    <div
      className={`modal-overlay ${isVisible ? 'fade-in' : ''}`}
      onClick={handleOverlayClick}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="modal-card">
        <h2 className="modal-title">任务详情</h2>

        <div className="form-group">
          <label>标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="任务标题"
          />
        </div>

        <div className="form-group">
          <label>描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="任务描述"
          />
        </div>

        <div className="form-group">
          <label>优先级</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task['priority'])}
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>

        <div className="form-group">
          <label>负责人</label>
          <input
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="负责人姓名"
          />
        </div>

        <div className="form-group">
          <label>故事点数</label>
          <input
            type="number"
            value={storyPoints}
            onChange={(e) => setStoryPoints(Number(e.target.value))}
            min="0"
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-delete" onClick={handleDelete}>
            删除
          </button>
          <button className="btn btn-cancel" onClick={handleClose}>
            取消
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
