import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { FilterStatus, STATUS_LABELS } from '@/types';
import { debounce, type DebouncedFunction } from '@/utils/debounce';
import { cn } from '@/lib/utils';

interface SearchFilterProps {
  onAddBook: () => void;
}

const filterTabs: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: STATUS_LABELS.pending },
  { key: 'drifting', label: STATUS_LABELS.drifting },
  { key: 'arrived', label: STATUS_LABELS.arrived },
];

export function SearchFilter({ onAddBook }: SearchFilterProps) {
  const { filterStatus, searchKeyword, setFilterStatus, setSearchKeyword } =
    useBookStore();
  const [inputValue, setInputValue] = useState(searchKeyword);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedFnRef = useRef<DebouncedFunction<(value: string) => void> | null>(null);

  const ensureDebounced = useCallback(() => {
    if (!debouncedFnRef.current) {
      debouncedFnRef.current = debounce((value: unknown) => {
        setSearchKeyword(value as string);
      }, 300);
    }
    return debouncedFnRef.current;
  }, [setSearchKeyword]);

  const debouncedSearch = useCallback((value: string) => {
    ensureDebounced()(value);
  }, [ensureDebounced]);

  const cancelDebounced = useCallback(() => {
    if (debouncedFnRef.current) {
      debouncedFnRef.current.cancel();
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelDebounced();
    };
  }, [cancelDebounced]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setInputValue('');
    cancelDebounced();
    setSearchKeyword('');
  }, [cancelDebounced, setSearchKeyword]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  useEffect(() => {
    setInputValue(searchKeyword);
  }, [searchKeyword]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border-2 bg-white px-4 py-2.5 transition-all duration-200',
            isFocused
              ? 'border-oak-500 shadow-lg shadow-oak-500/20'
              : 'border-oak-200 shadow-sm'
          )}
        >
          <Search
            size={20}
            className={cn(
              'flex-shrink-0 transition-colors duration-200',
              isFocused ? 'text-oak-600' : 'text-oak-400'
            )}
          />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="搜索书名、作者、ISBN..."
            className="flex-1 bg-transparent text-sm text-oak-800 placeholder:text-oak-400 focus:outline-none"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-oak-400 transition-colors hover:bg-oak-100 hover:text-oak-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={onAddBook}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl bg-oak-600 px-5 py-2.5',
            'text-sm font-medium text-white shadow-card',
            'transition-all duration-200 hover:bg-oak-700 hover:shadow-card-hover',
            'active:scale-95'
          )}
        >
          <Plus size={18} />
          <span>添加图书</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => {
          const isActive = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-oak-600 text-white shadow-md'
                  : 'bg-white text-oak-600 hover:bg-oak-100'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MemoSearchFilter = memo(SearchFilter);

export default MemoSearchFilter;
