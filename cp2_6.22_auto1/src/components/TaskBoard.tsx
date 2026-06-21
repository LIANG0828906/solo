import { useState } from 'react';
import * as Y from 'yjs';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useYjsStore } from '@/hooks/useYjsStore';
import { cn } from '@/lib/utils';
import type { ITask, TaskPriority, TaskStatus } from '@/shared/types';

interface TaskBoardProps {
  doc: Y.Doc;
}

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: '待办' },
  { id: 'in-progress', label: '进行中' },
  { id: 'done', label: '已完成' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'bg-danger text-white',
  medium: 'bg-warning text-white',
  low: 'bg-success text-white',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

function isOverdue(dueDate: number | null): boolean {
  if (!dueDate) return false;
  return dueDate < Date.now();
}

export default function TaskBoard({ doc }: TaskBoardProps) {
  const { tasks, addTask, updateTaskStatus, deleteTask, roomId } = useYjsStore();
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formAssignee, setFormAssignee] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const roomTasks = tasks
    .filter((t) => t.roomId === roomId)
    .sort((a, b) => a.order - b.order);

  const handleAddTask = () => {
    if (!formTitle.trim()) return;
    const maxOrder = roomTasks.length > 0 ? Math.max(...roomTasks.map((t) => t.order)) + 1 : 0;
    const task: ITask = {
      id: crypto.randomUUID(),
      roomId,
      title: formTitle.trim(),
      priority: formPriority,
      status: 'todo',
      assignee: formAssignee.trim(),
      dueDate: formDueDate ? new Date(formDueDate).getTime() : null,
      order: maxOrder,
    };
    addTask(task);
    setFormTitle('');
    setFormPriority('medium');
    setFormAssignee('');
    setFormDueDate('');
    setShowForm(false);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
    setDragId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex gap-3 h-full min-h-0">
      {COLUMNS.map((col) => {
        const colTasks = roomTasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className={cn(
              'flex-1 flex flex-col min-w-0 rounded-lg',
              'bg-white/40 dark:bg-surface-dark/40',
              'border border-border-light/50 dark:border-border-dark/50'
            )}
          >
            <div className="flex items-center justify-between px-2.5 py-2 border-b border-border-light/30 dark:border-border-dark/30">
              <span className="text-xs font-semibold text-text-light dark:text-text-dark">
                {col.label}
              </span>
              <span className="text-[10px] text-muted-light dark:text-muted-dark">
                {colTasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
              {colTasks.map((task) => {
                const overdue = isOverdue(task.dueDate) && task.status !== 'done';
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'rounded-lg p-2 cursor-grab active:cursor-grabbing transition-all duration-300',
                      'bg-white/70 dark:bg-surface-dark/70',
                      'border border-border-light/50 dark:border-border-dark/50',
                      'hover:shadow-md',
                      dragId === task.id && 'opacity-50 scale-95',
                      overdue && 'border-danger animate-pulse-slow'
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical
                        size={12}
                        className="text-muted-light dark:text-muted-dark mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded font-medium',
                              PRIORITY_COLORS[task.priority]
                            )}
                          >
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </div>
                        <p className="text-xs text-text-light dark:text-text-dark leading-snug">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {task.assignee && (
                            <span className="text-[10px] text-muted-light dark:text-muted-dark">
                              {task.assignee}
                            </span>
                          )}
                          {task.dueDate && (
                            <span
                              className={cn(
                                'text-[10px]',
                                overdue
                                  ? 'text-danger font-semibold'
                                  : 'text-muted-light dark:text-muted-dark'
                              )}
                            >
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-muted-light dark:text-muted-dark hover:text-danger transition-colors shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {col.id === 'todo' && (
              <div className="p-1.5 border-t border-border-light/30 dark:border-border-dark/30">
                {showForm ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      placeholder="任务标题"
                      className={cn(
                        'w-full px-2 py-1 rounded text-xs border outline-none',
                        'bg-white/50 dark:bg-surface-dark/50',
                        'border-border-light dark:border-border-dark',
                        'text-text-light dark:text-text-dark',
                        'placeholder:text-muted-light dark:placeholder:text-muted-dark'
                      )}
                    />
                    <div className="flex gap-1">
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                        className={cn(
                          'flex-1 px-1.5 py-1 rounded text-xs border outline-none',
                          'bg-white/50 dark:bg-surface-dark/50',
                          'border-border-light dark:border-border-dark',
                          'text-text-light dark:text-text-dark'
                        )}
                      >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                      </select>
                      <input
                        type="text"
                        value={formAssignee}
                        onChange={(e) => setFormAssignee(e.target.value)}
                        placeholder="负责人"
                        className={cn(
                          'flex-1 px-1.5 py-1 rounded text-xs border outline-none',
                          'bg-white/50 dark:bg-surface-dark/50',
                          'border-border-light dark:border-border-dark',
                          'text-text-light dark:text-text-dark',
                          'placeholder:text-muted-light dark:placeholder:text-muted-dark'
                        )}
                      />
                    </div>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className={cn(
                        'w-full px-1.5 py-1 rounded text-xs border outline-none',
                        'bg-white/50 dark:bg-surface-dark/50',
                        'border-border-light dark:border-border-dark',
                        'text-text-light dark:text-text-dark'
                      )}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleAddTask}
                        className="flex-1 px-2 py-1 rounded text-xs bg-accent text-white hover:bg-accent/80 transition-colors"
                      >
                        添加
                      </button>
                      <button
                        onClick={() => setShowForm(false)}
                        className="px-2 py-1 rounded text-xs text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1 w-full px-2 py-1 rounded text-xs text-accent hover:bg-accent/10 transition-colors"
                  >
                    <Plus size={12} />
                    添加任务
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
