import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, Priority, TaskColumn } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  initialTask?: Task | null;
  defaultColumn?: TaskColumn;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: '高', color: '#EF4444' },
  { value: 'medium', label: '中', color: '#F59E0B' },
  { value: 'low', label: '低', color: '#22C55E' },
];

const COLUMN_OPTIONS: { value: TaskColumn; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in-progress', label: '进行中' },
  { value: 'testing', label: '测试中' },
  { value: 'done', label: '已完成' },
];

export function TaskEditModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  defaultColumn = 'backlog',
}: TaskEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimateHours, setEstimateHours] = useState(2);
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('');
  const [column, setColumn] = useState<TaskColumn>(defaultColumn);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setEstimateHours(initialTask.estimateHours);
      setPriority(initialTask.priority);
      setAssignee(initialTask.assignee);
      setColumn(initialTask.column);
    } else {
      setTitle('');
      setDescription('');
      setEstimateHours(2);
      setPriority('medium');
      setAssignee('');
      setColumn(defaultColumn);
    }
  }, [initialTask, isOpen, defaultColumn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const task: Task = {
      id: initialTask?.id || uuidv4(),
      title: title.trim(),
      description: description.trim(),
      estimateHours,
      priority,
      assignee: assignee.trim(),
      column,
      order: initialTask?.order ?? 0,
      actualHours: initialTask?.actualHours ?? 0,
      createdAt: initialTask?.createdAt || new Date().toISOString(),
    };
    onSave(task);
    onClose();
  };

  const handleDelete = () => {
    if (initialTask && onDelete) {
      onDelete(initialTask.id);
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="modal-title">
            {initialTask ? '编辑任务' : '新建任务'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">任务标题 *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入任务标题..."
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">任务描述</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入任务描述..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">预估工时</label>
              <select
                className="form-select"
                value={estimateHours}
                onChange={(e) => setEstimateHours(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>
                    {h} 小时
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">优先级</label>
              <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: `2px solid ${priority === opt.value ? opt.color : '#E2E8F0'}`,
                      backgroundColor: priority === opt.value ? `${opt.color}15` : 'white',
                      color: priority === opt.value ? opt.color : '#64748B',
                      fontWeight: 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">负责人</label>
              <input
                type="text"
                className="form-input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="输入负责人..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">状态列</label>
              <select
                className="form-select"
                value={column}
                onChange={(e) => setColumn(e.target.value as TaskColumn)}
              >
                {COLUMN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            {initialTask && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  marginRight: 'auto',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                删除任务
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
