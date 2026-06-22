import { useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { TaskData, Priority } from '../../types';
import { TEAM_MEMBERS } from '../../types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  editingTask: TaskData | null;
  defaultColumnId: string | null;
}

function TaskModal({ open, onClose, editingTask, defaultColumnId }: TaskModalProps) {
  const columns = useBoardStore((s) => s.columns);
  const tasks = useBoardStore((s) => s.tasks);
  const createTask = useBoardStore((s) => s.createTask);
  const updateTask = useBoardStore((s) => s.updateTask);

  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedHours, setEstimatedHours] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [columnId, setColumnId] = useState<string>('');
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingTask) {
        setTitle(editingTask.title);
        setAssignee(editingTask.assignee || '');
        setPriority(editingTask.priority);
        setEstimatedHours(editingTask.estimated_hours);
        setStartDate(editingTask.start_date || '');
        setColumnId(editingTask.column_id);
        setDependencies(editingTask.dependencies || []);
      } else {
        setTitle('');
        setAssignee('');
        setPriority('medium');
        setEstimatedHours(1);
        setStartDate(new Date().toISOString().split('T')[0]);
        setColumnId(defaultColumnId || columns[0]?.id || '');
        setDependencies([]);
      }
      setErrors({});
      setSubmitting(false);
    }
  }, [open, editingTask, defaultColumnId, columns]);

  if (!open) return null;

  const isEditing = !!editingTask;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = '请输入任务标题';
    } else if (title.length > 50) {
      newErrors.title = '标题最多50字符';
    }
    if (estimatedHours < 0) {
      newErrors.estimatedHours = '预估工时不能为负数';
    }
    if (!columnId) {
      newErrors.columnId = '请选择列';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        assignee: assignee || null,
        priority,
        estimated_hours: Number(estimatedHours),
        column_id: columnId,
        start_date: startDate || null,
        dependencies,
      };

      if (isEditing && editingTask) {
        await updateTask(editingTask.id, payload);
      } else {
        await createTask(payload);
      }
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.detail || '操作失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDependencyToggle = (taskId: string) => {
    setDependencies((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const otherTasks = tasks.filter((t) => t.id !== editingTask?.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} title="关闭">
          ×
        </button>
        <h2 className="modal-title">{isEditing ? '编辑任务' : '新建任务'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">任务标题 *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              maxLength={50}
              autoFocus
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
            <div style={{ fontSize: 11, color: '#b2bec3', marginTop: 4, textAlign: 'right' }}>
              {title.length}/50
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">负责人</label>
            <select
              className="form-select"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">-- 请选择 --</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">优先级</label>
            <div className="priority-radio-group">
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <label
                  key={p}
                  className={`priority-radio ${p} ${priority === p ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                  />
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">预估工时（小时）</label>
            <input
              type="number"
              className="form-input"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              min={0}
              step={0.5}
            />
            {errors.estimatedHours && (
              <div className="form-error">{errors.estimatedHours}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">开始日期</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">所属列</label>
            <select
              className="form-select"
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">前置依赖任务</label>
            {otherTasks.length > 0 ? (
              <div className="dependencies-list">
                {otherTasks.map((t) => (
                  <div key={t.id} className="dependency-item">
                    <input
                      type="checkbox"
                      id={`dep-${t.id}`}
                      checked={dependencies.includes(t.id)}
                      onChange={() => handleDependencyToggle(t.id)}
                    />
                    <label htmlFor={`dep-${t.id}`}>{t.title}</label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '16px 0' }}>
                暂无可选任务
              </div>
            )}
          </div>

          {errors.submit && <div className="form-error">{errors.submit}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? '提交中...' : isEditing ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
