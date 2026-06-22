import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { usePollStore } from '@/store';

interface PollCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_TITLE_LENGTH = 50;
const MAX_OPTION_LENGTH = 20;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

export default function PollCreator({ isOpen, onClose }: PollCreatorProps) {
  const createPoll = usePollStore((s) => s.createPoll);
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadline, setDeadline] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const getDefaultDeadline = () => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '投票标题不能为空';
    } else if (title.trim().length > MAX_TITLE_LENGTH) {
      newErrors.title = `标题最多${MAX_TITLE_LENGTH}个字`;
    }

    const filledOptions = options.filter((o) => o.trim());
    if (filledOptions.length < MIN_OPTIONS) {
      newErrors.options = `至少需要${MIN_OPTIONS}个选项`;
    }

    options.forEach((opt, i) => {
      if (opt.trim() && opt.trim().length > MAX_OPTION_LENGTH) {
        newErrors[`option_${i}`] = `选项最多${MAX_OPTION_LENGTH}个字`;
      }
    });

    const nonEmpty = options.filter((o) => o.trim());
    const uniqueSet = new Set(nonEmpty.map((o) => o.trim().toLowerCase()));
    if (uniqueSet.size < nonEmpty.length) {
      newErrors.options = '选项不能重复';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const filledOptions = options.filter((o) => o.trim()).map((o) => o.trim());
    const deadlineMs = deadline
      ? new Date(deadline).getTime()
      : Date.now() + 24 * 60 * 60 * 1000;

    createPoll(title.trim(), filledOptions, deadlineMs);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setOptions(['', '']);
    setDeadline('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > MIN_OPTIONS) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">创建新投票</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              投票标题
              <span className="text-gray-400 font-normal ml-1">
                ({title.trim().length}/{MAX_TITLE_LENGTH})
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="例如：今天中午吃什么？"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 placeholder:text-gray-400"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              投票选项
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    maxLength={MAX_OPTION_LENGTH}
                    placeholder={`选项 ${i + 1}`}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 placeholder:text-gray-400"
                  />
                  {options.length > MIN_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {errors[`option_${i}`] && (
                    <span className="text-xs text-red-500 whitespace-nowrap">
                      {errors[`option_${i}`]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="mt-1 text-xs text-red-500">{errors.options}</p>
            )}
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus size={16} />
                添加选项
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              截止时间
              <span className="text-gray-400 font-normal ml-1">（默认24小时后）</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={getDefaultDeadline()}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-gray-700"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
              }}
            >
              创建投票
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
