import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Search, ChevronDown, Star, Plus, Video } from 'lucide-react';
import api from '@/client/shared/api/client';
import { cn } from '@/client/shared/utils/cn';
import type { AxiosResponse } from 'axios';
import type { Exercise, DifficultyLevel } from '@/shared/types';
import { MUSCLE_GROUPS } from '@/shared/types';

const EMPTY_FORM: { name: string; muscleGroup: string; difficulty: DifficultyLevel; description: string; mediaUrl: string } = { name: '', muscleGroup: String(MUSCLE_GROUPS[0]), difficulty: 3 as DifficultyLevel, description: '', mediaUrl: '' };

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? <mark key={i} className="bg-orange-200 text-orange-800 rounded px-0.5">{part}</mark> : part
      )}
    </>
  );
}

function DifficultyStars({ level }: { level: DifficultyLevel }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn('w-4 h-4', n <= level ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
      ))}
    </div>
  );
}

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api.get<Exercise[]>('/exercises')
      .then((res: AxiosResponse<Exercise[]>) => setExercises(res.data))
      .catch(() => setExercises([]));
  }, []);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const filtered = useMemo(() => {
    let list = exercises;
    if (activeGroup) list = list.filter(e => e.muscleGroup === activeGroup);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    return list;
  }, [exercises, activeGroup, debouncedSearch]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post<Exercise>('/exercises', form);
      setExercises(prev => [...prev, res.data]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">动作库</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> 添加动作
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索动作..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveGroup(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            activeGroup === null ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          全部
        </button>
        {MUSCLE_GROUPS.map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(prev => prev === group ? null : group)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeGroup === group ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(exercise => {
          const isExpanded = expandedId === exercise.id;
          return (
            <div key={exercise.id} className="card !p-0 overflow-hidden">
              <button
                onClick={() => toggleExpand(exercise.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">
                      <HighlightText text={exercise.name} query={debouncedSearch} />
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {exercise.muscleGroup}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={cn('w-5 h-5 text-gray-400 transition-transform duration-300', isExpanded && 'rotate-180')}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isExpanded ? 500 : 0, opacity: isExpanded ? 1 : 0 }}
              >
                <div className="px-5 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-600">
                    <HighlightText text={exercise.description} query={debouncedSearch} />
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">难度:</span>
                      <DifficultyStars level={exercise.difficulty} />
                    </div>
                    {exercise.mediaUrl && (
                      <a
                        href={exercise.mediaUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-orange-500 hover:underline"
                      >
                        <Video className="w-3.5 h-3.5" /> 查看演示
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无匹配的动作</div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">添加动作</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">动作名称</label>
                <input
                  type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">肌群</label>
                <select
                  value={form.muscleGroup}
                  onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 outline-none"
                >
                  {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">难度 (1-5)</label>
                <input
                  type="range" min={1} max={5}
                  value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) as DifficultyLevel }))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>简单</span><span>困难</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">演示链接</label>
                <input
                  type="text" value={form.mediaUrl}
                  onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">取消</button>
              <button
                onClick={handleSubmit} disabled={submitting || !form.name.trim()}
                className="flex-1 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-50"
              >
                {submitting ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
