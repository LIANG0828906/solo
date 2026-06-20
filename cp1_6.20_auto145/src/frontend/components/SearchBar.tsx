import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleSearchClick = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearch(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const InkDropLoader = () => (
    <svg
      className="ink-drop-spin w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C12 2 6 8 6 13C6 16.3137 8.68629 19 12 19C15.3137 19 18 16.3137 18 13C18 8 12 2 12 2Z"
        fill="#8b6f47"
        opacity="0.8"
      />
      <circle
        cx="12"
        cy="14"
        r="3"
        fill="#2c2c2c"
      />
    </svg>
  );

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <div className="flex items-center bg-white rounded-lg shadow-md overflow-hidden border border-[#d4c9b8]">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入诗句关键词，如'明月'、'思乡'..."
            className="flex-1 px-6 py-4 text-lg bg-transparent outline-none text-[#2c2c2c] placeholder-[#9c9c9c] font-fangsong"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSearchClick}
            disabled={isLoading}
            className="btn-click flex items-center justify-center px-6 py-4 bg-[#8b6f47] text-white hover:bg-[#725a38] transition-colors disabled:opacity-50"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="搜索"
          >
            {isLoading ? <InkDropLoader /> : <Search size={24} />}
          </button>
        </div>
        {isLoading && (
          <div className="absolute left-1/2 transform -translate-x-1/2 mt-3">
            <div className="flex items-center gap-2 text-[#8b6f47] text-sm">
              <InkDropLoader />
              <span>正在检索诗词...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(SearchBar);
