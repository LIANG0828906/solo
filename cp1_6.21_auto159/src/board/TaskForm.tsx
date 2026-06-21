import { useState } from 'react';
import type { TaskStatus, TaskPriority } from '@/types';
import { MEMBERS } from '@/types';
import { useBoardStore } from '@/store/boardStore';

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: '高', color: 'text-red-500' },
  { value: 'medium', label: '中', color: 'text-amber-500' },
  { value: 'low', label: '低', color: 'text-emerald-500' },
];

interface TaskFormProps {
  boardId: string;
  status: TaskStatus;
  onClose: () => void;
}

export default function TaskForm({ boardId, status, onClose }: TaskFormProps) {
  const addTask = useBoardStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState<string>(MEMBERS[0]);
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask(boardId, { title: title.trim(), description: description.trim(), assignee, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4"
      >
        <h3 className="font-semibold text-lg text-slate-800">添加任务</h3>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">标题</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
            placeholder="任务标题"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            placeholder="任务描述"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">负责人</label>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          >
            {MEMBERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">优先级</label>
          <div className="flex gap-4">
            {PRIORITY_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={opt.value}
                  checked={priority === opt.value}
                  onChange={() => setPriority(opt.value)}
                  className="accent-current"
                />
                <span className={`text-sm font-medium ${opt.color}`}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            创建
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
