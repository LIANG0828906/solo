import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localValue, onChange]);

  return (
    <div className={`search-bar ${focused ? 'search-bar--focused' : ''}`}>
      <HiOutlineSearch className="search-bar__icon" />
      <input
        type="text"
        className="search-bar__input"
        placeholder="搜索书名、作者、原文或标签…"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}
