import { Search, Filter } from 'lucide-react';
import { CATEGORIES } from '../types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <div className="search-bar-category">
        <Filter size={18} className="search-bar-icon" />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="search-bar-select"
        >
          <option value="">全部分类</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="search-bar-input-wrapper">
        <Search size={18} className="search-bar-icon" />
        <input
          type="text"
          placeholder="搜索书名、作者..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-bar-input"
        />
      </div>
    </div>
  );
}
