import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useStore } from '@/shared/store';
import type { Task } from '@/shared/types';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setHighlightedTaskId = useStore((s) => s.setHighlightedTaskId);
  const teamMembers = useStore((s) => s.teamMembers);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback((task: Task) => {
    setActiveTab('board');
    setHighlightedTaskId(task.id);
    setOpen(false);
    setQuery('');
    setTimeout(() => {
      const element = document.querySelector(`[data-task-id="${task.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
      setTimeout(() => setHighlightedTaskId(null), 3000);
    }, 100);
  }, [setActiveTab, setHighlightedTaskId]);

  const getAssignee = (taskId: string) => teamMembers.find((m) => m.id === taskId);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索任务标题、描述或负责人..."
          className="w-full pl-8 pr-8 py-2 text-xs font-body bg-white/70 backdrop-blur-glass border border-white/60 rounded-full outline-none focus:border-macaron-mint focus:shadow-card transition-all placeholder:text-gray-300"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-macaron-dark"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 w-full bg-white/90 backdrop-blur-glass rounded-card shadow-card-hover z-50 overflow-hidden animate-slide-up">
          {results.slice(0, 8).map((task) => {
            const assignee = getAssignee(task.assignee);
            return (
              <button
                key={task.id}
                onClick={() => handleSelect(task)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-macaron-warm/50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div
                  className={`w-1 h-8 rounded-full flex-shrink-0 ${
                    task.lane === 'todo' ? 'bg-macaron-purple' : task.lane === 'inProgress' ? 'bg-macaron-mint' : 'bg-macaron-pink'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-display font-semibold text-macaron-dark truncate">{task.title}</p>
                  <p className="text-[10px] text-gray-400 truncate">{task.description}</p>
                </div>
                {assignee && (
                  <span className="text-sm flex-shrink-0">{assignee.avatar}</span>
                )}
                <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {open && results.length === 0 && query && (
        <div className="absolute top-full mt-1.5 w-full bg-white/90 backdrop-blur-glass rounded-card shadow-card-hover z-50 p-4 text-center text-xs text-gray-400 animate-slide-up">
          未找到匹配的任务
        </div>
      )}
    </div>
  );
}
