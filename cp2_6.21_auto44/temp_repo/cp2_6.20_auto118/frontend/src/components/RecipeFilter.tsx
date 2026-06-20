import React from 'react';

export interface FilterOptions {
  cuisine: string;
  cookTime: string;
  difficulty: string;
  search: string;
}

interface RecipeFilterProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

const cuisineOptions = [
  { value: 'all', label: '全部' },
  { value: '中式', label: '中式' },
  { value: '西式', label: '西式' },
  { value: '日式', label: '日式' },
  { value: '韩式', label: '韩式' },
  { value: '其他', label: '其他' },
];

const cookTimeOptions = [
  { value: 'all', label: '全部' },
  { value: '15', label: '15分钟内' },
  { value: '30', label: '30分钟内' },
  { value: '60', label: '1小时内' },
  { value: '60+', label: '1小时以上' },
];

const difficultyOptions = [
  { value: 'all', label: '全部' },
  { value: '1', label: '1星' },
  { value: '2', label: '2星' },
  { value: '3', label: '3星' },
  { value: '4', label: '4星' },
  { value: '5', label: '5星' },
];

const RecipeFilter: React.FC<RecipeFilterProps> = ({ filters, onChange }) => {
  const handleChange = (key: keyof FilterOptions, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="recipe-filter">
      <div className="recipe-filter-item">
        <label className="recipe-filter-label">菜系</label>
        <select
          className="recipe-filter-select"
          value={filters.cuisine}
          onChange={(e) => handleChange('cuisine', e.target.value)}
        >
          {cuisineOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="recipe-filter-item">
        <label className="recipe-filter-label">烹饪时间</label>
        <select
          className="recipe-filter-select"
          value={filters.cookTime}
          onChange={(e) => handleChange('cookTime', e.target.value)}
        >
          {cookTimeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="recipe-filter-item">
        <label className="recipe-filter-label">难度</label>
        <select
          className="recipe-filter-select"
          value={filters.difficulty}
          onChange={(e) => handleChange('difficulty', e.target.value)}
        >
          {difficultyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="recipe-filter-item recipe-filter-search">
        <label className="recipe-filter-label">搜索</label>
        <div className="recipe-filter-search-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="recipe-filter-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="recipe-filter-input"
            placeholder="搜索食谱..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default RecipeFilter;
