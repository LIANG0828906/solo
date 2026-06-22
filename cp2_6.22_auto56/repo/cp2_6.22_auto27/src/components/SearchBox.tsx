import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Carrot, Sparkles } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onIngredientMatch?: (ingredients: string[]) => void;
  placeholder?: string;
  debounceMs?: number;
}

const SUGGESTED_INGREDIENTS = ['鸡蛋', '番茄', '土豆', '鸡胸肉', '牛肉', '豆腐', '蘑菇', '胡萝卜'];

export default function SearchBox({
  onSearch,
  onIngredientMatch,
  placeholder = '搜索食谱或输入食材...',
  debounceMs = 300,
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<'search' | 'ingredient'>('search');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const filteredSuggestions = SUGGESTED_INGREDIENTS.filter(
    (ing) =>
      !selectedIngredients.includes(ing) &&
      query.length > 0 &&
      ing.includes(query)
  );

  useEffect(() => {
    setSuggestions(filteredSuggestions.slice(0, 5));
  }, [query, selectedIngredients]);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        if (mode === 'search') {
          onSearch(value);
        }
      }, debounceMs);
    },
    [mode, onSearch, debounceMs]
  );

  useEffect(() => {
    if (mode === 'search' && query.length >= 0) {
      debouncedSearch(query);
    }
  }, [query, mode, debouncedSearch]);

  const handleIngredientClick = (ingredient: string) => {
    const newIngredients = [...selectedIngredients, ingredient];
    setSelectedIngredients(newIngredients);
    setQuery('');
    onIngredientMatch?.(newIngredients);
  };

  const removeIngredient = (ingredient: string) => {
    const newIngredients = selectedIngredients.filter((i) => i !== ingredient);
    setSelectedIngredients(newIngredients);
    onIngredientMatch?.(newIngredients);
  };

  const clearAll = () => {
    setQuery('');
    setSelectedIngredients([]);
    onSearch('');
    onIngredientMatch?.([]);
    inputRef.current?.focus();
  };

  const toggleMode = () => {
    const newMode = mode === 'search' ? 'ingredient' : 'search';
    setMode(newMode);
    setQuery('');
    setSelectedIngredients([]);
    onSearch('');
    onIngredientMatch?.([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && mode === 'ingredient' && query.trim()) {
      const ingredient = query.trim();
      if (!selectedIngredients.includes(ingredient)) {
        handleIngredientClick(ingredient);
      }
    }
    if (e.key === 'Backspace' && !query && selectedIngredients.length > 0) {
      removeIngredient(selectedIngredients[selectedIngredients.length - 1]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`relative flex items-center bg-white rounded-full border-2 transition-all duration-300 ${
          isFocused
            ? 'border-terracotta-400 shadow-lg shadow-terracotta-500/10'
            : 'border-cream-200 hover:border-cream-300'
        }`}
      >
        <div className="pl-4 pr-2">
          {mode === 'search' ? (
            <Search size={20} className="text-terracotta-400" />
          ) : (
            <Carrot size={20} className="text-terracotta-400" />
          )}
        </div>

        <div className="flex-1 flex items-center flex-wrap gap-1.5 py-2">
          {mode === 'ingredient' &&
            selectedIngredients.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm
                           bg-terracotta-50 text-caramel-700 border border-terracotta-100
                           animate-fadeIn"
                style={{ animation: 'fadeIn 0.2s ease-out' }}
              >
                {ing}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeIngredient(ing);
                  }}
                  className="hover:text-terracotta-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'ingredient' && selectedIngredients.length > 0
                ? ''
                : placeholder
            }
            className="flex-1 min-w-[120px] bg-transparent outline-none text-caramel-700 placeholder:text-cream-400 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 pr-2">
          {(query || selectedIngredients.length > 0) && (
            <button
              onClick={clearAll}
              className="p-1.5 rounded-full hover:bg-cream-100 transition-colors"
            >
              <X size={16} className="text-caramel-500" />
            </button>
          )}
          <button
            onClick={toggleMode}
            title={mode === 'search' ? '切换到食材匹配' : '切换到关键词搜索'}
            className={`p-2 rounded-full transition-all duration-200 ${
              mode === 'ingredient'
                ? 'bg-terracotta-100 text-terracotta-600'
                : 'text-caramel-400 hover:bg-cream-100'
            }`}
          >
            <Sparkles size={18} />
          </button>
        </div>
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-cream-100 overflow-hidden z-50">
          <div className="px-4 py-2 text-xs font-medium text-caramel-500 bg-cream-50 border-b border-cream-100">
            {mode === 'search' ? '推荐搜索' : '推荐食材'}
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => {
                if (mode === 'ingredient') {
                  handleIngredientClick(suggestion);
                } else {
                  setQuery(suggestion);
                  onSearch(suggestion);
                }
                setIsFocused(false);
              }}
              style={{ animationDelay: `${index * 30}ms` }}
              className="w-full px-4 py-2.5 text-left text-caramel-700 hover:bg-terracotta-50
                         transition-colors flex items-center gap-2"
            >
              {mode === 'ingredient' ? (
                <Carrot size={16} className="text-terracotta-400" />
              ) : (
                <Search size={16} className="text-terracotta-400" />
              )}
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {isFocused && mode === 'ingredient' && selectedIngredients.length === 0 && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-cream-100 overflow-hidden z-50">
          <div className="px-4 py-2 text-xs font-medium text-caramel-500 bg-cream-50 border-b border-cream-100">
            热门食材
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {SUGGESTED_INGREDIENTS.map((ing) => (
              <button
                key={ing}
                onClick={() => handleIngredientClick(ing)}
                className="px-3 py-1.5 rounded-full text-sm bg-cream-50 text-caramel-600
                           border border-cream-200 hover:bg-terracotta-50 hover:border-terracotta-200
                           hover:text-terracotta-700 transition-all"
              >
                + {ing}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
