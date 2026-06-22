import React, { useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useTimelineStore } from '../store';
import { CATEGORIES } from '../types';
import type { Category } from '../types';

export const FilterPanel: React.FC = () => {
  const {
    yearRange,
    categories,
    searchKeyword,
    setYearRange,
    toggleCategory,
    setSearchKeyword,
  } = useTimelineStore();

  const minYear = 1870;
  const maxYear = 2023;

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = parseInt(e.target.value, 10);
    const end = yearRange[1];
    if (start < end) {
      setYearRange([start, end]);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const end = parseInt(e.target.value, 10);
    const start = yearRange[0];
    if (end > start) {
      setYearRange([start, end]);
    }
  };

  const activeCategories = useMemo(() => categories, [categories]);

  return (
    <div className="filter-panel">
      <div className="panel-header">
        <SlidersHorizontal size={20} />
        <h3>筛选条件</h3>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          关键词搜索
        </label>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜索事件..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          年代范围
          <span className="range-values">
            {yearRange[0]} - {yearRange[1]}
          </span>
        </label>
        <div className="range-slider-container">
          <div className="range-slider">
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={yearRange[0]}
              onChange={handleStartChange}
              className="slider slider-start"
            />
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={yearRange[1]}
              onChange={handleEndChange}
              className="slider slider-end"
            />
          </div>
          <div className="range-track">
            <div
              className="range-track-fill"
              style={{
                left: `${((yearRange[0] - minYear) / (maxYear - minYear)) * 100}%`,
                width: `${((yearRange[1] - yearRange[0]) / (maxYear - minYear)) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="range-labels">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          事件类别
        </label>
        <div className="category-list">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategories.includes(cat.value as Category);
            return (
              <button
                key={cat.value}
                className={`category-btn ${isActive ? 'active' : ''}`}
                style={{
                  '--cat-color': cat.color,
                } as React.CSSProperties}
                onClick={() => toggleCategory(cat.value as Category)}
              >
                <span
                  className="category-dot"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
