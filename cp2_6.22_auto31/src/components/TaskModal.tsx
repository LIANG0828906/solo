import { useState, useEffect } from 'react';
import { Task } from '../types';
import './components.css';

interface TaskModalProps {
  task: Task | null;
  isCreateMode?: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onCreate?: (data: { title: string; description: string; storyPoints: number; priority: Task['priority']; assignee: string }) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskModal({ task, isCreateMode = false, onClose, onSave, onCreate, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [assignee, setAssignee] = useState('');
  const [storyPoints, setStoryPoints] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isCreateMode) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignee('未分配');
      setStoryPoints(1);
      setIsVisible(true);
    } else if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setAssignee(task.assignee);
      setStoryPoints(task.storyPoints);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [task, isCreateMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (task || isCreateMode) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [task, isCreateMode, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (isCreateMode && onCreate) {
      onCreate({
        title: title.trim(),
        description: description.trim(),
        storyPoints,
        priority,
        assignee: assignee.trim() || '未分配',
      });
    } else if (task) {
      const updatedTask: Task = {
        ...task,
        title,
        description,
        priority,
        assignee,
        storyPoints,
      };
      onSave(updatedTask);
    }
    handleClose();
  };

  const handleDelete = () => {
    if (!task || !onDelete) return;
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

  const showModal = isCreateMode || (task !== null && isVisible);

  if (!showModal && !isVisible) return null;

  return (
    <div
      className={`modal-overlay ${isVisible ? 'fade-in' : ''}`}
      onClick={handleOverlayClick}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="modal-card">
        <h2 className="modal-title">
          {isCreateMode ? '创建新任务' : '任务详情'}
        </h2>

        <div className="form-group">
          <label>标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入任务标题"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入任务描述（可选）"
            rows={4}
          />
        </div>

        {!isCreateMode && (
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
        )}

        {!isCreateMode && (
          <div className="form-group">
            <label>负责人</label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="负责人姓名"
            />
          </div>
        )}

        <div className="form-group">
          <label>故事点数</label>
          <input
            type="number"
            value={storyPoints}
            onChange={(e) => setStoryPoints(Number(e.target.value))}
            min="0"
            step="1"
          />
        </div>

        <div className="modal-actions">
          {!isCreateMode && onDelete && (
            <button className="btn btn-delete" onClick={handleDelete}>
              删除
            </button>
          )}
          <button className="btn btn-cancel" onClick={handleClose}>
            取消
          </button>
          <button
            className="btn btn-save"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            {isCreateMode ? '创建' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
