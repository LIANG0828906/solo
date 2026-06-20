import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ResourceType, FilterOptions } from '../types';
import { resourceTypeLabels } from '../types';
import { useStore } from '../store';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar() {
  const { filters, setFilters, resources } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(filters.search);
  const debounced = useDebounce(input, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = debounced.trim()
    ? resources
        .filter(r => r.name.toLowerCase().includes(debounced.toLowerCase()))
        .slice(0, 6)
    : [];

  useEffect(() => {
    if (debounced !== filters.search) {
      setFilters({ search: debounced });
    }
  }, [debounced]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // keep open
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const toggleType = useCallback((t: ResourceType) => {
    const has = filters.types.includes(t);
    setFilters({
      types: has ? filters.types.filter(x => x !== t) : [...filters.types, t],
    });
  }, [filters.types, setFilters]);

  const highlight = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-brand-500/30 text-brand-300 rounded px-0.5">
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const clearAll = () => {
    setFilters({ types: [], search: '', minSize: undefined, maxSize: undefined, startDate: undefined, endDate: undefined });
    setInput('');
  };

  return (
    <div className="w-full mb-6 relative" ref={dropdownRef}>
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="搜索资源名称..."
            className="input-base w-full pl-11 pr-10"
          />
          {input && (
            <button
              onClick={() => setInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-800 border border-surface-600 rounded-card overflow-hidden z-50 shadow-xl animate-slide-up">
              {suggestions.map(r => (
                <a
                  key={r.id}
                  href={`/resources/${r.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-700 cursor-pointer transition-colors"
                >
                  <img src={r.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-surface-100 font-medium truncate">
                      {highlight(r.name, debounced)}
                    </div>
                    <div className="text-xs text-surface-400">{resourceTypeLabels[r.type]}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className={`btn-secondary flex items-center gap-2 ${open ? 'ring-2 ring-brand-500/40' : ''}`}
        >
          <Filter size={16} />
          <span>筛选</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {open && (
        <div className="mt-3 p-4 bg-surface-700/80 backdrop-blur border border-surface-600 rounded-card animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-300 mb-2 block">资源类型</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(resourceTypeLabels) as ResourceType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all ${
                      filters.types.includes(t)
                        ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white'
                        : 'bg-surface-800 text-surface-300 hover:bg-surface-600'
                    }`}
                  >
                    {resourceTypeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-300 mb-2 block">
                尺寸范围 (px)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  value={filters.minSize ?? ''}
                  onChange={e => setFilters({ minSize: e.target.value ? Number(e.target.value) : undefined })}
                  className="input-base w-full text-sm py-2"
                />
                <span className="text-surface-500">–</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={filters.maxSize ?? ''}
                  onChange={e => setFilters({ maxSize: e.target.value ? Number(e.target.value) : undefined })}
                  className="input-base w-full text-sm py-2"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-300 mb-2 block">开始日期</label>
              <input
                type="date"
                value={filters.startDate ?? ''}
                onChange={e => setFilters({ startDate: e.target.value || undefined })}
                className="input-base w-full text-sm py-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-surface-300 mb-2 block">结束日期</label>
              <input
                type="date"
                value={filters.endDate ?? ''}
                onChange={e => setFilters({ endDate: e.target.value || undefined })}
                className="input-base w-full text-sm py-2"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={clearAll} className="btn-ghost text-sm">
              清空筛选
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
