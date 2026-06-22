import React, { useCallback, useRef, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = '搜索文档...' }: SearchBarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, 200);
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      type="text"
      defaultValue={value}
      onChange={handleChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 16px',
        borderRadius: '8px',
        border: '2px solid transparent',
        background: '#334155',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s ease'
      }}
      onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
      onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
    />
  );
}
