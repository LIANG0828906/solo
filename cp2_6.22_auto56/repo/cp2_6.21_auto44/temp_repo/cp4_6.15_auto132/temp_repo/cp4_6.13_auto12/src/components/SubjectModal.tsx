import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { subjectApi } from '@/utils/api';
import type { Subject } from '@/types';

interface Props {
  subject: Subject | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRESET_COLORS = [
  '#7c6fff', '#f5c542', '#22c55e', '#ef4444', '#3b82f6',
  '#ec4899', '#06b6d4', '#f97316', '#a855f7', '#14b8a6',
];

export default function SubjectModal({ subject, onClose, onSaved }: Props) {
  const [name, setName] = useState(subject?.name || '');
  const [weeklyGoal, setWeeklyGoal] = useState<number>(subject?.weekly_goal_hours ?? 5);
  const [color, setColor] = useState(subject?.color || PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入科目名称');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (subject) {
        await subjectApi.update(subject.id, {
          name: name.trim(),
          weekly_goal_hours: weeklyGoal,
          color,
        });
      } else {
        await subjectApi.create({
          name: name.trim(),
          weekly_goal_hours: weeklyGoal,
          color,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!subject) return;
    if (!confirm(`确定要删除科目「${subject.name}」吗？相关学习记录不会被删除。`)) return;
    try {
      await subjectApi.remove(subject.id);
      onSaved();
    } catch (err: any) {
      setError(err.message || '删除失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-bg-secondary border border-zinc-700/40 rounded-2xl shadow-2xl animate-fade-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-zinc-700/30">
          <h2 className="text-lg font-semibold text-text-primary">
            {subject ? '编辑科目' : '创建科目'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              科目名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：编程、数学、英语"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              每周目标学时：{weeklyGoal} 小时
            </label>
            <input
              type="range"
              min={0.5}
              max={40}
              step={0.5}
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(parseFloat(e.target.value))}
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>0.5h</span>
              <span>20h</span>
              <span>40h</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              颜色标识
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`aspect-square rounded-xl transition-all duration-200 ${
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-secondary scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {subject && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-secondary !px-3 !py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '保存中...' : subject ? '保存修改' : '创建科目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
