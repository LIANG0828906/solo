import { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, MapPin, User } from 'lucide-react';
import { search } from './api';
import type { SearchResult } from './types';
import { STALL_TYPE_COLORS, STALL_TYPE_LABELS } from './types';

interface SearchProps {
  activityId: string;
  onSelect: (result: SearchResult) => void;
}

export function Search({ activityId, onSelect }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await search(activityId, q);
      setResults(data.results);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.length >= 3) {
      debounceRef.current = window.setTimeout(() => runSearch(query), 300);
    } else {
      setResults([]);
    }
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="搜索摊主、商品或摊位号..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white shadow-sm text-sm text-header-brown placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-btn-amber/50 focus:border-btn-amber transition-all"
        />
      </div>

      {showResults && (query.length >= 3 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-card-hover border border-gray-100 overflow-hidden z-50 animate-float-up">
          {loading && (
            <div className="p-4 text-sm text-gray-500 text-center">搜索中...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-4 text-sm text-gray-500 text-center">未找到匹配结果</div>
          )}
          {!loading && results.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {results.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(r);
                    setShowResults(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-bg-cream/50 transition-colors border-b border-gray-50 last:border-b-0 flex items-start gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: r.stallType ? STALL_TYPE_COLORS[r.stallType] : '#D3D3D3' }}
                  >
                    {r.stallNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-header-brown">
                      <span className="font-semibold">#{r.stallNumber}</span>
                      {r.stallType && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: STALL_TYPE_COLORS[r.stallType] + '20', color: STALL_TYPE_COLORS[r.stallType] }}>
                          {STALL_TYPE_LABELS[r.stallType]}
                        </span>
                      )}
                    </div>
                    {r.ownerName && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                        <User className="w-3 h-3" />
                        <span>{r.ownerName}</span>
                      </div>
                    )}
                    {r.matchedItem && (
                      <div className="flex items-center gap-1 text-xs text-gray-700 mt-1">
                        <MapPin className="w-3 h-3 text-btn-amber" />
                        <span>商品: <span className="font-medium">{r.matchedItem}</span></span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
