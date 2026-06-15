import { useState, useRef, useEffect } from 'react';
import type { Project, Task, TaskStatus, Priority } from './types';
import { taskApi } from './api';

interface TaskBoardProps {
  project: Project;
  allProjects: Project[];
  onProjectUpdate: (projects: Project[]) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  completed: '已完成',
};

const STATUS_CYCLE: TaskStatus[] = ['todo', 'in_progress', 'completed'];

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#e74c3c',
  medium: '#f1c40f',
  low: '#27ae60',
};

export default function TaskBoard({ project, allProjects, onProjectUpdate }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [animatingStatus, setAnimatingStatus] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formDate, setFormDate] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateSlideRef = useRef<{ direction: 'left' | 'right' | null }>({ direction: null });

  useEffect(() => {
    const sorted = [...project.tasks].sort((a, b) => a.order - b.order);
    setTasks(sorted);
  }, [project.id, project.tasks]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const handleStatusClick = async (task: Task) => {
    setAnimatingStatus(prev => new Set(prev).add(task.id));
    const currentIdx = STATUS_CYCLE.indexOf(task.status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    const updatedProjects = allProjects.map(p => {
      if (p.id !== project.id) return p;
      return { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t) };
    });
    onProjectUpdate(updatedProjects);
    setTimeout(() => {
      setAnimatingStatus(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }, 300);
    try {
      await taskApi.updateStatus(task.id, nextStatus);
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    dragItemRef.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== taskId && dragItemRef.current !== taskId) {
      setDragOverId(taskId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragItemRef.current;
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const sourceIdx = tasks.findIndex(t => t.id === sourceId);
    const targetIdx = tasks.findIndex(t => t.id === targetId);
    if (sourceIdx < 0 || targetIdx < 0) return;
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(sourceIdx, 1);
    newTasks.splice(targetIdx, 0, removed);
    const reordered = newTasks.map((t, idx) => ({ ...t, order: idx }));
    setTasks(reordered);
    const updatedProjects = allProjects.map(p => {
      if (p.id !== project.id) return p;
      return { ...p, tasks: reordered };
    });
    onProjectUpdate(updatedProjects);
    dragItemRef.current = null;
    try {
      await taskApi.reorder(project.id, reordered.map(t => t.id));
    } catch {
      // revert on error, silently
    }
  };

  const handleDragEnd = () => {
    dragItemRef.current = null;
    setDragOverId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;
    setFormSubmitting(true);
    try {
      const newTask = await taskApi.create({
        projectId: project.id,
        title: formTitle.trim(),
        description: formDesc.trim(),
        dueDate: formDate,
        priority: formPriority,
      });
      const updatedTasks = [...tasks, { ...newTask, order: tasks.length }];
      setTasks(updatedTasks);
      const updatedProjects = allProjects.map(p => {
        if (p.id !== project.id) return p;
        return { ...p, tasks: updatedTasks };
      });
      onProjectUpdate(updatedProjects);
      setShowModal(false);
      setFormTitle('');
      setFormDesc('');
      setFormPriority('medium');
      setFormDate('');
      showToast('任务发布成功！');
    } finally {
      setFormSubmitting(false);
    }
  };

  const changeMonth = (delta: number, direction: 'left' | 'right') => {
    dateSlideRef.current = { direction };
    let { year, month } = currentMonth;
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    setCurrentMonth({ year, month });
    setTimeout(() => { dateSlideRef.current = { direction: null }; }, 300);
  };

  const renderCalendar = () => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const slideDir = dateSlideRef.current.direction;
    const today = new Date();
    const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const isSelected = (d: number) => {
      if (!formDate) return false;
      const [y, m, day] = formDate.split('-').map(Number);
      return y === year && m - 1 === month && day === d;
    };
    return (
      <div className="date-picker-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <button type="button" className="cal-nav-btn" onClick={() => changeMonth(-1, 'right')}>‹</button>
          <div className={`calendar-title ${slideDir ? `slide-${slideDir}` : ''}`} key={`${year}-${month}`}>
            {year}年 {monthNames[month]}
          </div>
          <button type="button" className="cal-nav-btn" onClick={() => changeMonth(1, 'left')}>›</button>
        </div>
        <div className="calendar-weekdays">
          {weekDays.map(w => <div key={w} className="cal-weekday">{w}</div>)}
        </div>
        <div className="calendar-grid">
          {cells.map((d, idx) => (
            <div
              key={idx}
              className={`cal-day ${d === null ? 'empty' : ''} ${d && isToday(d) ? 'today' : ''} ${d && isSelected(d) ? 'selected' : ''}`}
              onClick={() => {
                if (d === null) return;
                const mStr = String(month + 1).padStart(2, '0');
                const dStr = String(d).padStart(2, '0');
                setFormDate(`${year}-${mStr}-${dStr}`);
                setShowDatePicker(false);
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="task-board">
      <header className="board-header">
        <div>
          <h2>{project.name}</h2>
          <p className="board-subtitle">共 {tasks.length} 个任务</p>
        </div>
      </header>

      <div className="tasks-container">
        {tasks.length === 0 ? (
          <div className="tasks-empty">
            <p>暂无任务，点击右下角按钮创建新任务</p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map(task => {
              const isDragOver = dragOverId === task.id;
              const isAnimating = animatingStatus.has(task.id);
              return (
                <div
                  key={task.id}
                  className={`task-card ${isDragOver ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="task-card-top">
                    <h4 className="task-title">{task.title}</h4>
                    <span
                      className="priority-tag"
                      style={{ backgroundColor: PRIORITY_COLORS[task.priority], color: task.priority === 'medium' ? '#333' : '#fff' }}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>
                  <p className="task-desc">{task.description}</p>
                  <div className="task-card-bottom">
                    <span className="task-due-date">📅 {task.dueDate}</span>
                    <button
                      type="button"
                      className={`status-btn status-${task.status} ${isAnimating ? 'status-animate' : ''}`}
                      onClick={() => handleStatusClick(task)}
                    >
                      {STATUS_LABELS[task.status]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className="fab-btn"
        onClick={() => setShowModal(true)}
        title="发布新任务"
      >
        +
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setShowDatePicker(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发布新任务</h3>
              <button type="button" className="modal-close" onClick={() => { setShowModal(false); setShowDatePicker(false); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="请输入任务标题"
                  required
                />
              </div>
              <div className="form-group">
                <label>优先级</label>
                <select
                  className="form-select"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as Priority)}
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div className="form-group">
                <label>截止日期 *</label>
                <div className="date-picker-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    value={formDate}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="选择日期"
                    readOnly
                    required
                  />
                  {showDatePicker && renderCalendar()}
                </div>
              </div>
              <div className="form-group">
                <label>任务描述</label>
                <textarea
                  className="form-textarea"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="描述任务详情（选填）"
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowModal(false); setShowDatePicker(false); }}>取消</button>
                <button type="submit" className="btn-submit" disabled={formSubmitting}>
                  {formSubmitting ? '提交中...' : '发布任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`toast ${toast.show ? 'toast-show' : ''}`}>
        ✅ {toast.message}
      </div>
    </div>
  );
}
