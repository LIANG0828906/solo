import React, { useState } from 'react';
import { PlusCircle, X, Loader2 } from 'lucide-react';
import type { TaskCategory } from '../types';
import { cn } from '../lib/utils';

const categories: TaskCategory[] = [
  '跑腿代办',
  '家政服务',
  '工具借用',
  '技能互助',
  '宠物照料',
  '其他',
];

interface TaskFormProps {
  onPublish: (title: string, description: string, reward: number, category: TaskCategory) => boolean;
  currentPoints: number;
}

export function TaskForm({ onPublish, currentPoints }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState<number>(10);
  const [category, setCategory] = useState<TaskCategory>('跑腿代办');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setReward(10);
    setCategory('跑腿代办');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请填写任务标题');
      return;
    }
    if (title.length > 200) {
      setError('标题不能超过200字');
      return;
    }
    if (!description.trim()) {
      setError('请填写任务描述');
      return;
    }
    if (description.length > 500) {
      setError('描述不能超过500字');
      return;
    }
    if (reward < 1 || reward > 999) {
      setError('奖励积分应在1-999之间');
      return;
    }
    if (reward > currentPoints) {
      setError(`积分不足，当前积分：${currentPoints}`);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const success = onPublish(title.trim(), description.trim(), reward, category);
      if (success) {
        resetForm();
        setIsOpen(false);
      } else {
        setError('发布失败，请稍后重试');
      }
      setLoading(false);
    }, 400);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 px-6',
          'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium',
          'rounded-xl shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700',
          'transition-all duration-200',
        )}
      >
        <PlusCircle size={20} />
        <span>发布新任务</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 text-lg">发布新任务</h3>
        <button
          onClick={() => {
            setIsOpen(false);
            resetForm();
          }}
          className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            任务标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="简要描述任务，如：帮忙取快递到3号楼"
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border border-slate-200',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition',
              'text-sm text-slate-800 placeholder:text-slate-400',
            )}
          />
          <div className="text-xs text-slate-400 mt-1 text-right">
            {title.length}/200
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            任务描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="详细说明任务要求、时间、地点等信息"
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border border-slate-200 resize-none',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition',
              'text-sm text-slate-800 placeholder:text-slate-400',
            )}
          />
          <div className="text-xs text-slate-400 mt-1 text-right">
            {description.length}/500
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white',
                'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition',
                'text-sm text-slate-800',
              )}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              奖励积分{' '}
              <span className="text-xs text-slate-400">(余额:{currentPoints})</span>
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={reward}
              onChange={(e) =>
                setReward(
                  Math.min(999, Math.max(1, parseInt(e.target.value) || 1)),
                )
              }
              className={cn(
                'w-full px-4 py-2.5 rounded-lg border border-slate-200',
                'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition',
                'text-sm text-slate-800',
              )}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium',
              'bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors',
            )}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium text-white',
              'bg-blue-500 hover:bg-blue-600 transition-colors',
              'disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? '发布中...' : '确认发布'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskForm;
