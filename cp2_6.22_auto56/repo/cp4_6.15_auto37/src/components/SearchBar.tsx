import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = '搜索商品或摊位...' }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <div className="hidden sm:flex items-center glass-card px-4 py-2 gap-2 w-full sm:w-80">
        <Search size={18} className="text-amber-700 flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-amber-900 placeholder-amber-600/60"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-full hover:bg-amber-500/20 transition-colors"
            aria-label="清除搜索"
          >
            <X size={16} className="text-amber-700" />
          </button>
        )}
      </div>

      <div className="sm:hidden">
        {expanded ? (
          <div className="glass-card px-4 py-2 flex items-center gap-2 animate-fade-in-up">
            <Search size={18} className="text-amber-700 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-amber-900 placeholder-amber-600/60 min-w-0"
            />
            {value && (
              <button
                onClick={() => onChange('')}
                className="p-1 rounded-full hover:bg-amber-500/20 transition-colors"
                aria-label="清除搜索"
              >
                <X size={16} className="text-amber-700" />
              </button>
            )}
            <button
              onClick={() => {
                onChange('');
                setExpanded(false);
              }}
              className="p-1 rounded-full hover:bg-amber-500/20 transition-colors"
              aria-label="关闭搜索"
            >
              <X size={18} className="text-amber-700" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="p-2.5 rounded-lg glass-card hover:bg-white/60 transition-all"
            aria-label="展开搜索"
          >
            <Search size={20} className="text-amber-700" />
          </button>
        )}
      </div>
    </div>
  );
}
