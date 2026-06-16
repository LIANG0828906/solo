import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    estimatedHours: number;
    deadline: string;
  }) => void;
  initialData?: {
    title?: string;
    description?: string;
    estimatedHours?: number;
    deadline?: string;
  };
  mode?: 'create' | 'edit';
  editFields?: 'description' | 'deadline' | 'all';
}

export default function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
  editFields = 'all',
}: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setEstimatedHours(initialData.estimatedHours || 4);
      setDeadline(initialData.deadline || '');
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setEstimatedHours(4);
      setDeadline('');
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (editFields === 'all' && !title.trim()) {
      newErrors.title = '请输入任务标题';
    }
    if (!description.trim()) {
      newErrors.description = '请输入任务描述';
    }
    if (editFields === 'all' && estimatedHours <= 0) {
      newErrors.estimatedHours = '预计工时必须大于0';
    }
    if (!deadline) {
      newErrors.deadline = '请选择截止日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      estimatedHours,
      deadline,
    });
    onClose();
  };

  if (!isOpen) return null;

  const isTitleDisabled = (field: string) => {
    if (editFields === 'all') return false;
    return editFields !== field;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {mode === 'create' ? '发布新任务' : '编辑任务'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
            任务标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isTitleDisabled('title')}
              placeholder="请输入任务标题"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors ${
                errors.title ? 'border-red-300' : 'border-gray-200'
              } ${isTitleDisabled('title') ? 'bg-gray-50 text-gray-500' : ''}`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
            任务描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isTitleDisabled('description')}
              placeholder="请输入任务详细描述"
              rows={3}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              } ${isTitleDisabled('description') ? 'bg-gray-50 text-gray-500' : ''}`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                预计工时（小时）
              </label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                disabled={isTitleDisabled('estimatedHours')}
                min={0.5}
                step={0.5}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors ${
                  errors.estimatedHours ? 'border-red-300' : 'border-gray-200'
                } ${isTitleDisabled('estimatedHours') ? 'bg-gray-50 text-gray-500' : ''}`}
              />
              {errors.estimatedHours && (
                <p className="text-xs text-red-500 mt-1">{errors.estimatedHours}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                截止日期
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isTitleDisabled('deadline')}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors ${
                  errors.deadline ? 'border-red-300' : 'border-gray-200'
                } ${isTitleDisabled('deadline') ? 'bg-gray-50 text-gray-500' : ''}`}
              />
              {errors.deadline && (
                <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {mode === 'create' ? '发布任务' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
