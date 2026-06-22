import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import useKanbanStore from '../store/useKanbanStore';
import type { Task } from '../../shared/types';

export default function TaskDetailModal() {
  const { modalOpen, selectedTask, setModalOpen, selectTask, currentUser } =
    useKanbanStore();

  const [form, setForm] = useState<Partial<Task>>({});

  useEffect(() => {
    if (selectedTask) {
      setForm({
        title: selectedTask.title,
        description: selectedTask.description,
        priority: selectedTask.priority,
        assignee: selectedTask.assignee,
        storyPoints: selectedTask.storyPoints,
      });
    }
  }, [selectedTask]);

  if (!modalOpen || !selectedTask) return null;

  const handleClose = () => {
    setModalOpen(false);
    selectTask(null);
  };

  const handleSave = async () => {
    await fetch(`/api/tasks/${selectedTask.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, user: currentUser?.name ?? 'Unknown' }),
    });
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="absolute inset-0 bg-black/40"
        style={{ transition: 'opacity 0.3s', opacity: modalOpen ? 1 : 0 }}
      />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 animate-[fadeIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-[#2c3e50] mb-5">任务详情</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2c3e50] mb-1">
              标题
            </label>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2c3e50] mb-1">
              描述
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                优先级
              </label>
              <select
                value={form.priority || 'medium'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as Task['priority'],
                  })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                故事点
              </label>
              <input
                type="number"
                min={0}
                value={form.storyPoints ?? 0}
                onChange={(e) =>
                  setForm({ ...form, storyPoints: Number(e.target.value) })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2c3e50] mb-1">
              负责人
            </label>
            <input
              type="text"
              value={form.assignee || ''}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
