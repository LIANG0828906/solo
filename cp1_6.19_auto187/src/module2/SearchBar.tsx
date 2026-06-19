import React, { useState, useCallback } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';

const DEBOUNCE_DELAY = 300;

export const SearchBar: React.FC = () => {
  const { setSearchText } = useRecipeStore();
  const [inputValue, setInputValue] = useState('');

  const debouncedSetSearch = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchText(value);
        }, DEBOUNCE_DELAY);
      };
    })(),
    [setSearchText]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetSearch(value);
  };

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '16px',
          color: '#8B7355',
        }}
      >
        🔍
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="搜索食谱名称..."
        style={{
          width: '100%',
          padding: '10px 12px 10px 36px',
          border: '2px dashed #D2B48C',
          borderRadius: '999px',
          fontSize: '14px',
          outline: 'none',
          background: '#FEFAF0',
          color: '#5C4033',
          fontFamily: 'var(--font-body)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#8B6F47';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 111, 71, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#D2B48C';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
};
