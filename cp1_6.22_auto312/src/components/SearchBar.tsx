import React, { useCallback } from 'react';
import type { PlantCategory } from '../types';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: Set<PlantCategory>;
  onFilterToggle: (category: PlantCategory) => void;
}

const filterCategories: PlantCategory[] = ['多肉', '观叶', '开花'];

const SearchBar: React.FC<SearchBarProps> = function SearchBar({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterToggle,
}) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索植物..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className={styles.filterButtons}>
        {filterCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={`${styles.filterBtn} ${
              activeFilters.has(category) ? styles.active : ''
            }`}
            onClick={() => onFilterToggle(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
