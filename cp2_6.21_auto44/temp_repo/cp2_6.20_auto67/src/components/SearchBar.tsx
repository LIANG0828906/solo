import { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useStarStore } from '@/store/starStore';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (starName: string) => boolean;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showError, setShowError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  const findStarByName = useStarStore((state) => state.findStarByName);
  const famousStarNames = useRef<string[]>(['天狼星', '织女星', '牛郎星', '北极星', '参宿四', '参宿七']);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;

      const star = findStarByName(query);
      if (star) {
        onSearch(query);
        setShowError(false);
      } else {
        setShowError(true);
        if (errorTimeoutRef.current) {
          window.clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = window.setTimeout(() => {
          setShowError(false);
        }, 2000);
      }
    },
    [query, findStarByName, onSearch]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setShowError(false);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        window.clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="search-container">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className={`search-wrapper ${isFocused ? 'focused' : ''}`}>
          <Search className="search-icon" size={18} />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="搜索恒星名称..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      </form>

      <div className={`search-error ${showError ? 'visible' : ''}`}>
        未找到该恒星
      </div>

      <div className="search-suggestions">
        {famousStarNames.current.map((name) => (
          <button
            key={name}
            className="suggestion-chip"
            onClick={() => {
              setQuery(name);
              onSearch(name);
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
