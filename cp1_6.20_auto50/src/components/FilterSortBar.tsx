import React from 'react';
import { FilterType, SortType } from '../types';

interface FilterSortBarProps {
  filter: FilterType;
  sortBy: SortType;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  onAddClick: () => void;
}

const FilterSortBar: React.FC<FilterSortBarProps> = ({
  filter,
  sortBy,
  onFilterChange,
  onSortChange,
  onAddClick,
}) => {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'expiringSoon', label: '即将过期' },
    { key: 'lowStock', label: '库存不足' },
    { key: 'expired', label: '已过期' },
  ];

  const sortOptions: { key: SortType; label: string }[] = [
    { key: 'name', label: '按名称' },
    { key: 'quantityAsc', label: '数量升序' },
    { key: 'quantityDesc', label: '数量降序' },
    { key: 'expiry', label: '按有效期' },
  ];

  return (
    <div className="filter-sort-bar">
      <div className="filter-tabs">
        {filters.map(f => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="sort-add-section">
        <div className="sort-select">
          <label>排序：</label>
          <select value={sortBy} onChange={e => onSortChange(e.target.value as SortType)}>
            {sortOptions.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary add-btn" onClick={onAddClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加药品
        </button>
      </div>
    </div>
  );
};

export default FilterSortBar;
