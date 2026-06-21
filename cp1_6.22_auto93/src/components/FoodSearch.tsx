import { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import type { Food } from '@/types';

interface FoodSearchProps {
  onSelectFood: (food: Food) => void;
  foods: Food[];
  onSearch: (query: string) => void;
}

export default function FoodSearch({ onSelectFood, foods, onSearch }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      onSearch(value);
      if (value) setIsOpen(true);
    }, 1000);
  }, [onSearch]);

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (food: Food) => {
    onSelectFood(food);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="food-search-container" ref={containerRef}>
      <label className="label">搜索食物</label>
      <div style={{ position: 'relative' }}>
        <Search
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999',
          }}
          size={18}
        />
        <input
          type="text"
          className="input"
          placeholder="输入食物名称..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          style={{ paddingLeft: '40px' }}
        />
      </div>
      {isOpen && foods.length > 0 && (
        <div className="food-search-results">
          {foods.map((food) => (
            <div
              key={food.id}
              className="food-search-item"
              onClick={() => handleSelect(food)}
            >
              <div className="food-search-item-name">{food.name}</div>
              <div className="food-search-item-meta">
                {food.category} · {food.calories}kcal/100g
              </div>
            </div>
          ))}
        </div>
      )}
      {isOpen && query && foods.length === 0 && (
        <div className="food-search-results">
          <div className="food-search-item" style={{ color: '#999' }}>
            未找到匹配的食物
          </div>
        </div>
      )}
    </div>
  );
}
