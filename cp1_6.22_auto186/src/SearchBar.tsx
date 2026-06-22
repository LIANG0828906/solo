import React from 'react';
import type { SortOption } from './types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  sortOption: SortOption;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onSortChange, sortOption }) => {
  return (
    <div style={styles.container}>
      <div style={styles.searchWrapper}>
        <svg
          style={styles.searchIcon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="搜索食材名称..."
          onChange={(e) => onSearch(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.sortWrapper}>
        <label style={styles.sortLabel}>排序：</label>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          style={styles.select}
        >
          <option value="name-asc">按名称（A-Z）</option>
          <option value="expiry-asc">按过期日期（最近优先）</option>
          <option value="added-desc">按添加时间（最新）</option>
        </select>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1',
    minWidth: '200px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 16px 12px 44px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  sortWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sortLabel: {
    fontSize: '14px',
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
};

export default SearchBar;
