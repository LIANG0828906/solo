import React from 'react';
import { FilterState, SortOrder, TagColor, TAG_COLORS } from '@/types';
import { getColorHex } from '@/utils';
import styles from '@/styles/FilterBar.module.css';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  totalCount,
  filteredCount,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, searchQuery: e.target.value });
  };

  const handleClearSearch = () => {
    onFilterChange({ ...filter, searchQuery: '' });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, sortOrder: e.target.value as SortOrder });
  };

  const toggleColor = (color: TagColor) => {
    const selectedColors = filter.selectedColors.includes(color)
      ? filter.selectedColors.filter(c => c !== color)
      : [...filter.selectedColors, color];
    onFilterChange({ ...filter, selectedColors });
  };

  const toggleFavorites = () => {
    onFilterChange({ ...filter, onlyFavorites: !filter.onlyFavorites });
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索灵感标题或内容..."
            value={filter.searchQuery}
            onChange={handleSearchChange}
          />
          {filter.searchQuery && (
            <button
              className={`${styles.clearBtn} ${styles.visible}`}
              onClick={handleClearSearch}
              aria-label="清除搜索"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>排序:</span>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={filter.sortOrder}
              onChange={handleSortChange}
            >
              <option value="newest">最新优先</option>
              <option value="oldest">最早优先</option>
            </select>
            <span className={styles.selectArrow}>▼</span>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>标签:</span>
          <div className={styles.colorFilterList}>
            {TAG_COLORS.map(colorOption => (
              <div
                key={colorOption.value}
                className={`${styles.colorChip} ${
                  filter.selectedColors.includes(colorOption.value) ? styles.active : ''
                }`}
                style={{ backgroundColor: colorOption.hex, color: getColorHex(colorOption.value) }}
                onClick={() => toggleColor(colorOption.value)}
                title={colorOption.label}
              />
            ))}
          </div>
        </div>

        <button
          className={`${styles.toggleBtn} ${filter.onlyFavorites ? styles.active : ''}`}
          onClick={toggleFavorites}
        >
          <span>{filter.onlyFavorites ? '⭐' : '☆'}</span>
          <span>仅显示收藏</span>
        </button>

        <span className={styles.resultCount}>
          {filteredCount} / {totalCount} 张卡片
        </span>
      </div>
    </div>
  );
};

export default FilterBar;
