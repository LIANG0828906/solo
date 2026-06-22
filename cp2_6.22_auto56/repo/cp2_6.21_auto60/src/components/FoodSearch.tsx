import { useState, useRef, useEffect } from 'react';
import { useFoodStore } from '@/store/foodStore';
import type { FoodItem } from '@/types';

interface FoodSearchProps {
  onSelect?: (food: FoodItem) => void;
}

export default function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchFood = useFoodStore((state) => state.searchFood);
  const searchResults = useFoodStore((state) => state.searchResults);
  const selectFood = useFoodStore((state) => state.selectFood);
  const selectedFood = useFoodStore((state) => state.selectedFood);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debounceRef = useRef<number>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (query.trim()) {
      debounceRef.current = window.setTimeout(() => {
        searchFood(query);
        setIsDropdownOpen(true);
      }, 200);
    } else {
      setIsDropdownOpen(false);
    }
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchFood]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (food: FoodItem) => {
    selectFood(food);
    setQuery(food.name);
    setIsDropdownOpen(false);
    onSelect?.(food);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px',
            color: 'var(--text-muted)',
          }}
        >
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsDropdownOpen(true)}
          placeholder="搜索食物，支持中英文和拼音..."
          style={{
            width: '100%',
            padding: '14px 16px 14px 44px',
            border: '2px solid transparent',
            borderRadius: 'var(--radius-md)',
            fontSize: '15px',
            background: 'white',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 0 4px rgba(78, 205, 196, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'transparent';
            e.target.style.boxShadow = 'var(--shadow-sm)';
          }}
        />
      </div>

      {isDropdownOpen && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '320px',
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {searchResults.map((food) => (
            <div
              key={food.id}
              onClick={() => handleSelect(food)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {food.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {food.nameEn}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                  {food.calories} kcal
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  每100克
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDropdownOpen && query.trim() && searchResults.length === 0 && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            zIndex: 50,
          }}
        >
          未找到相关食物
        </div>
      )}
    </div>
  );
}
