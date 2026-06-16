import { useState, useMemo } from 'react';
import { Search, Grid3X3, List, X, Menu } from 'lucide-react';
import { useExhibitStore } from '../store';
import { useDebounce } from '../hooks/useDebounce';
import './SearchBar.css';

function SearchBar() {
  const { viewMode, toggleViewMode, setSearchKeyword, allTags, selectedTags, toggleTag, clearSelectedTags } = useExhibitStore();
  const [inputValue, setInputValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const debouncedValue = useDebounce(inputValue, 300);

  useMemo(() => {
    setSearchKeyword(debouncedValue);
  }, [debouncedValue, setSearchKeyword]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClear = () => {
    setInputValue('');
  };

  return (
    <div className="search-bar">
      <div className="search-bar-row">
        <button
          className="icon-btn"
          onClick={toggleViewMode}
          aria-label={viewMode === 'grid' ? '切换到列表视图' : '切换到网格视图'}
        >
          {viewMode === 'grid' ? <List size={20} /> : <Grid3X3 size={20} />}
        </button>

        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="搜索展品..."
            value={inputValue}
            onChange={handleInputChange}
          />
          {inputValue && (
            <button className="clear-btn" onClick={handleClear} aria-label="清除搜索">
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="icon-btn mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="展开筛选菜单"
        >
          <Menu size={20} />
        </button>

        <div className={`tag-filters ${isMobileMenuOpen ? 'mobile-visible' : ''}`}>
          <button
            className={`tag-btn ${selectedTags.length === 0 ? 'active' : ''}`}
            onClick={clearSelectedTags}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
