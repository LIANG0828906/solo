import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import useStore from '../store/useStore';
import { Recipe } from '../shared/types';
import './SearchBar.css';

function SearchBar() {
  const [localValue, setLocalValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = useStore(state => state.searchResults);
  const performSearch = useStore(state => state.performSearch);
  const setSearchKeyword = useStore(state => state.setSearchKeyword);
  const setSearchResults = useStore(state => state.setSearchResults);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    setIsOpen(true);

    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    setSearchKeyword('');
    setSearchResults([]);
    setIsOpen(false);
  }, [setSearchKeyword, setSearchResults]);

  const handleResultClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="search-bar-container" ref={containerRef}>
      <div className={`search-input-wrapper ${isOpen ? 'focused' : ''}`}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder="搜索菜谱名称或食材..."
          className="search-input"
        />
        {localValue && (
          <button className="search-clear-btn" onClick={handleClear} aria-label="清除">
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="search-results-dropdown">
          <div className="search-results-header">
            <span>搜索结果</span>
            <span className="search-results-count">{searchResults.length} 条</span>
          </div>
          <ul className="search-results-list">
            {searchResults.map((recipe: Recipe) => (
              <li key={recipe.id}>
                <Link
                  to={`/recipe/${recipe.id}`}
                  className="search-result-item"
                  onClick={handleResultClick}
                >
                  <div className="search-result-thumb">
                    <img src={recipe.image} alt={recipe.title} loading="lazy" />
                  </div>
                  <div className="search-result-info">
                    <h4 className="search-result-title">{recipe.title}</h4>
                    <p className="search-result-desc">{recipe.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && localValue.trim() && searchResults.length === 0 && (
        <div className="search-results-dropdown empty">
          <div className="search-empty-state">
            <span className="search-empty-icon">🍳</span>
            <p>没有找到相关菜谱</p>
            <span className="search-empty-hint">试试其他关键词吧</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
