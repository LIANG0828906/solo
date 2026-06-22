import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { COLORS } from '@/utils/constants';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = '搜索笔记...',
  debounceMs = 200,
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    onChange('');
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#fff',
          opacity: 0.6,
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 36px 10px 36px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          border: `1px solid ${isFocused ? COLORS.gold : 'rgba(255, 255, 255, 0.3)'}`,
          borderRadius: '6px',
          color: '#fff',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          fontFamily: 'inherit',
        }}
      />
      {value && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#fff',
            opacity: 0.6,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
