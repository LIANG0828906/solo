import React, { useRef, useEffect, useState } from 'react';

interface SearchBarProps {
  onSearch: (value: string) => void;
  placeholder?: string;
}

const SearchIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#8D6E63' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = '搜索图书、作者...' }) => {
  const [inputValue, setInputValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 500);
  };

  const handleClear = () => {
    setInputValue('');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onSearch('');
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  };

  const iconWrapStyle: React.CSSProperties = {
    position: 'absolute',
    left: 18,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 48px 14px 48px',
    borderRadius: 24,
    border: '2px solid #D7CCC8',
    backgroundColor: '#FFFBF5',
    fontSize: 15,
    color: '#3E2723',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  };

  const clearBtnStyle: React.CSSProperties = {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: inputValue ? 'rgba(141, 110, 99, 0.2)' : 'transparent',
    color: '#8D6E63',
    fontSize: 14,
    cursor: inputValue ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: inputValue ? 1 : 0,
    transition: 'opacity 0.15s ease, background-color 0.15s ease',
    padding: 0,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#8D6E63';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(141, 110, 99, 0.12)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#D7CCC8';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={containerStyle}>
      <div style={iconWrapStyle}>
        <SearchIcon />
      </div>
      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={inputStyle}
      />
      <button
        type="button"
        style={clearBtnStyle}
        onClick={handleClear}
        aria-label="清除搜索内容"
      >
        ×
      </button>
    </div>
  );
};

export default SearchBar;
