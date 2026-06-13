import { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import dayjs from 'dayjs';
import type { Task, Priority } from '../types';

interface TaskDetailModalProps {
  isOpen: boolean;
  task: Task;
  columnId: string;
  isNew: boolean;
  onClose: () => void;
  onSave: (task: Task, columnId: string, isNew: boolean) => void;
  onDelete: (taskId: string, columnId: string) => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: '高优先级', color: 'bg-red-500' },
  { value: 'medium', label: '中优先级', color: 'bg-yellow-400' },
  { value: 'low', label: '低优先级', color: 'bg-green-500' },
];

export const TaskDetailModal = ({
  isOpen,
  task,
  columnId,
  isNew,
  onClose,
  onSave,
  onDelete,
}: TaskDetailModalProps) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setEditedTask(task);
    setErrors({});
  }, [task]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editedTask.title.trim()) {
      newErrors.title = '请输入任务标题';
    }
    if (!editedTask.assignee.trim()) {
      newErrors.assignee = '请输入负责人';
    }
    if (!editedTask.dueDate) {
      newErrors.dueDate = '请选择截止日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(editedTask, columnId, isNew);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className="
          relative bg-white rounded-2xl shadow-2xl w-full max-w-lg
          animate-modal-pop-in overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isNew ? '新建任务' : '任务详情'}
          </h2>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
              transition-all duration-150
            "
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              任务标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) =>
                setEditedTask({ ...editedTask, title: e.target.value })
              }
              placeholder="请输入任务标题"
              className={`
                w-full px-4 py-2.5 rounded-lg border text-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-400/50
                transition-all duration-150
                ${errors.title ? 'border-red-300 focus:ring-red-400/50' : 'border-gray-200 focus:border-blue-400'}
              `}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              任务描述
            </label>
            <textarea
              value={editedTask.description}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              placeholder="请输入任务描述（可选）"
              rows={3}
              className="
                w-full px-4 py-2.5 rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400
                text-gray-800 resize-none transition-all duration-150
              "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              优先级
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setEditedTask({ ...editedTask, priority: option.value })
                  }
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border
                    transition-all duration-150
                    ${
                      editedTask.priority === option.value
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-400/30'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${option.color}`}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                截止日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={editedTask.dueDate}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, dueDate: e.target.value })
                }
                min={dayjs().format('YYYY-MM-DD')}
                className={`
                  w-full px-4 py-2.5 rounded-lg border text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-blue-400/50
                  transition-all duration-150
                  ${errors.dueDate ? 'border-red-300 focus:ring-red-400/50' : 'border-gray-200 focus:border-blue-400'}
                `}
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-500">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                负责人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editedTask.assignee}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, assignee: e.target.value })
                }
                placeholder="负责人姓名"
                className={`
                  w-full px-4 py-2.5 rounded-lg border text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-blue-400/50
                  transition-all duration-150
                  ${errors.assignee ? 'border-red-300 focus:ring-red-400/50' : 'border-gray-200 focus:border-blue-400'}
                `}
              />
              {errors.assignee && (
                <p className="mt-1 text-xs text-red-500">{errors.assignee}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {!isNew ? (
            <button
              onClick={() => onDelete(editedTask.id, columnId)}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                text-red-600 hover:bg-red-50 hover:text-red-700
                transition-all duration-150
              "
            >
              <Trash2 size={16} />
              <span className="text-sm font-medium">删除</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="
                px-5 py-2 rounded-lg text-sm font-medium text-gray-600
                hover:bg-gray-100 transition-all duration-150
              "
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="
                flex items-center gap-2 px-5 py-2 rounded-lg
                bg-[#4A90D9] text-white text-sm font-medium
                hover:bg-[#3a7bc8] active:bg-[#3570b8]
                transition-all duration-150 shadow-sm hover:shadow
              "
            >
              <Save size={16} />
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
