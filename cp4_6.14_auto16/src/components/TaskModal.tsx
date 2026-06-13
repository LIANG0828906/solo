import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, AlertTriangle, Users } from 'lucide-react';
import type { Task, TeamMember, Priority } from '@/utils/types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/utils/types';

interface TaskModalProps {
  task: Task | null;
  members: TeamMember[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (id: string) => void;
}

export function TaskModal({
  task,
  members,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '' as string | '',
    priority: 'medium' as Priority,
    estimatedHours: 4,
    dueDate: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigneeId: task.assigneeId || '',
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        dueDate: task.dueDate,
      });
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [task]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !formData.title.trim()) return;

    const updated: Task = {
      ...task,
      title: formData.title.trim(),
      description: formData.description.trim()
        ? formData.description
        : undefined,
      assigneeId: formData.assigneeId || null,
      priority: formData.priority,
      estimatedHours: Math.max(0.5, formData.estimatedHours),
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
  };

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white/95 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeIn_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            编辑任务
          </h2>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              任务标题 <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="请输入任务标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              任务描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
              placeholder="详细描述任务内容..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Users size={14} /> 负责人
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) =>
                  setFormData({ ...formData, assigneeId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
              >
                <option value="">未分配</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                优先级
              </label>
              <div className="flex gap-1">
                {(['urgent', 'high', 'medium', 'low'] as Priority[]).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, priority: p })
                      }
                      className={`
                        flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all
                        ${
                          formData.priority === p
                            ? 'ring-2 ring-offset-1 scale-105'
                            : 'opacity-70 hover:opacity-100'
                        }
                      `}
                      style={{
                        backgroundColor:
                          formData.priority === p
                            ? PRIORITY_COLORS[p]
                            : `${PRIORITY_COLORS[p]}33`,
                        color:
                          formData.priority === p
                            ? 'white'
                            : PRIORITY_COLORS[p],
                        // @ts-ignore
                        ringColor: PRIORITY_COLORS[p],
                      }}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Clock size={14} /> 预计工时
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedHours: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  小时
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Calendar size={14} /> 截止日期
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-4">
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                删除任务
              </button>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!formData.title.trim()}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all hover-scale bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                保存修改
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
