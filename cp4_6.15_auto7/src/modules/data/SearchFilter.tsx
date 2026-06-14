import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { NODE_COLORS } from './DataManager';

interface SearchFilterProps {
  onFilterChange: (searchQuery: string, selectedColors: string[]) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    onFilterChange(debouncedQuery, selectedColors);
  }, [debouncedQuery, selectedColors, onFilterChange]);

  const handleColorToggle = useCallback((color: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(color)) {
        return prev.filter((c) => c !== color);
      } else {
        return [...prev, color];
      }
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedColors([]);
  }, []);

  const hasActiveFilters = searchQuery || selectedColors.length > 0;

  return (
    <>
      <div className="sidebar-section">
        <div className="section-title">搜索</div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索标题或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">颜色筛选</div>
        <div className="color-filter-group">
          {NODE_COLORS.map((color) => (
            <button
              key={color}
              className={`color-filter-btn ${selectedColors.includes(color) ? 'active' : ''}`}
              style={{ background: color }}
              onClick={() => handleColorToggle(color)}
              title={`筛选 ${color} 节点`}
            />
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button className="btn btn-secondary" onClick={clearSearch}>
          <X size={16} />
          <span className="btn-text">清除筛选</span>
        </button>
      )}
    </>
  );
};
