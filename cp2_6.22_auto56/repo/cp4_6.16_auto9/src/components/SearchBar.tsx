import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChefHat, Sparkles } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (ings: string[]) => void;
  onSearch: () => void;
  suggestions?: string[];
}

const PRESET_INGREDIENTS = [
  '鸡蛋', '番茄', '洋葱', '土豆', '牛肉', '猪肉', '鸡肉',
  '豆腐', '青椒', '葱', '蒜', '姜', '大米', '面粉',
];

const SearchBar: React.FC<Props> = ({ value, onChange, onSearch, suggestions }) => {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const addIng = (ing: string) => {
    const trimmed = ing.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const removeIng = (ing: string) => {
    onChange(value.filter((i) => i !== ing));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        addIng(input);
        setInput('');
      } else {
        onSearch();
      }
    } else if (e.key === 'Backspace' && !input && value.length) {
      removeIng(value[value.length - 1]);
    } else if (e.key === ',' || e.key === '，') {
      e.preventDefault();
      if (input.trim()) {
        addIng(input);
        setInput('');
      }
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`relative rounded-2xl border-2 transition-all duration-150 bg-white overflow-hidden ${
          focused
            ? 'border-warm-400 shadow-[0_0_0_3px_rgba(255,140,66,0.2)]'
            : 'border-warm-100 shadow-card'
        }`}
      >
        <div className="flex items-center px-4 py-3.5 gap-2 flex-wrap">
          <ChefHat className="text-warm-400 flex-shrink-0" size={22} />
          <div className="flex flex-wrap gap-1.5 flex-1 items-center min-w-[120px]">
            {value.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-warm-50 to-warm-100 text-warm-600 text-sm font-medium border border-warm-200"
                style={{ animation: 'fadeInUp 200ms ease' }}
              >
                {ing}
                <button
                  onClick={() => removeIng(ing)}
                  className="w-4 h-4 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-warm-400 hover:text-warm-600 transition"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              placeholder={
                value.length === 0
                  ? '输入冰箱里的食材，按回车或逗号分隔...'
                  : ''
              }
              className="flex-1 min-w-[100px] outline-none bg-transparent text-sm text-cocoa-400 placeholder-cocoa-100"
            />
          </div>
          <button
            onClick={() => {
              if (input.trim()) {
                addIng(input);
                setInput('');
              }
              onSearch();
            }}
            className="btn-primary !py-2 !px-4 flex-shrink-0"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">推荐菜谱</span>
            <span className="sm:hidden">搜索</span>
          </button>
        </div>
      </div>

      {focused && suggestions && suggestions.length > 0 && (
        <div
          className="absolute z-20 w-full mt-2 p-3 bg-white rounded-2xl shadow-card-hover border border-cream-200"
          style={{ animation: 'fadeInUp 150ms ease' }}
        >
          <div className="text-xs text-cocoa-200 mb-2 px-1">热门食材，点击快速添加</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (!value.includes(s)) addIng(s);
                }}
                disabled={value.includes(s)}
                className={`tag-chip ${
                  value.includes(s) ? 'tag-chip-active' : ''
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
