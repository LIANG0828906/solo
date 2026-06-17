import { useEffect, useState } from 'react';
import type { Task } from '@/types';
import { useTaskStore } from '@/store/taskStore';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
}

export default function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const users = useTaskStore((state) => state.users);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setAssignee(task.assignee);
      setDueDate(task.dueDate);
    } else {
      setTitle('');
      setDescription('');
      setAssignee('');
      setDueDate('');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onSave({
      title: title.slice(0, 50),
      description: description.slice(0, 200),
      assignee,
      dueDate,
    });
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div
        style={{
          width: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          background: 'white',
          borderRadius: '16px',
        }}
        className="relative w-full"
      >
        <button
          onClick={onClose}
          style={{
            fontSize: '24px',
            color: '#999',
          }}
          className={cn(
            'absolute top-4 right-4 w-8 h-8 flex items-center justify-center',
            'hover:text-gray-900 transition-colors leading-none select-none'
          )}
        >
          ×
        </button>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 pr-10">
            {task.id ? '编辑任务' : '新建任务'}
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                标题
              </label>
              <input
                type="text"
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入任务标题"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {title.length}/50
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                描述
              </label>
              <textarea
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="请输入任务描述"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {description.length}/200
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                负责人
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">请选择负责人</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                截止日期
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                创建时间
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                {task.createdAt ? new Date(task.createdAt).toLocaleString('zh-CN') : '-'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
