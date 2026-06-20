import { useState, useEffect, useRef } from 'react';
import { tagsApi } from '../api';

interface SearchBarProps {
  onSearch: (keyword: string, tags: string[]) => void;
  keyword?: string;
  selectedTags?: string[];
}

export default function SearchBar({ onSearch, keyword = '', selectedTags = [] }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(keyword);
  const [tags, setTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tagsApi.getAll().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = tags
        .filter((tag) => tag.toLowerCase().includes(inputValue.toLowerCase()))
        .slice(0, 6);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, tags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleInputFocus = () => {
    if (inputValue.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSearch = () => {
    onSearch(inputValue.trim(), selectedTags);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!selectedTags.includes(suggestion) && selectedTags.length < 3) {
      const newTags = [...selectedTags, suggestion];
      onSearch(inputValue.trim(), newTags);
    }
    setShowSuggestions(false);
  };

  const toggleTag = (tag: string) => {
    let newTags: string[];
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter((t) => t !== tag);
    } else if (selectedTags.length < 3) {
      newTags = [...selectedTags, tag];
    } else {
      return;
    }
    onSearch(inputValue.trim(), newTags);
  };

  const removeTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTags = selectedTags.filter((t) => t !== tag);
    onSearch(inputValue.trim(), newTags);
  };

  const availableTags = tags.filter((tag) => !selectedTags.includes(tag));

  return (
    <div className="search-bar-container">
      <div className="search-bar" ref={dropdownRef}>
        <div className="search-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="搜索代码片段标题或描述..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
        />
        <button className="search-btn" onClick={handleSearch}>
          搜索
        </button>

        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <svg className="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                {suggestion}
                <span className="suggestion-hint">点击添加为标签</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tag-filter" ref={tagDropdownRef}>
        <button
          className="tag-filter-btn"
          onClick={() => setShowTagDropdown(!showTagDropdown)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          标签筛选
          {selectedTags.length > 0 && (
            <span className="tag-count">{selectedTags.length}</span>
          )}
        </button>

        {showTagDropdown && (
          <div className="tag-dropdown">
            <div className="tag-dropdown-header">
              <span>选择标签（最多3个）</span>
              {selectedTags.length > 0 && (
                <button
                  className="clear-tags-btn"
                  onClick={() => onSearch(inputValue.trim(), [])}
                >
                  清空
                </button>
              )}
            </div>
            <div className="tag-dropdown-list">
              {selectedTags.length > 0 && (
                <div className="tag-section">
                  <span className="tag-section-title">已选</span>
                  <div className="tag-list">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="tag tag-selected"
                        onClick={(e) => removeTag(tag, e)}
                      >
                        {tag}
                        <span className="tag-remove">×</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {availableTags.length > 0 && (
                <div className="tag-section">
                  <span className="tag-section-title">可选</span>
                  <div className="tag-list">
                    {availableTags.map((tag) => (
                      <span
                        key={tag}
                        className={`tag tag-option ${selectedTags.length >= 3 ? 'tag-disabled' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="selected-tags">
          {selectedTags.map((tag) => (
            <span key={tag} className="selected-tag">
              {tag}
              <button
                className="remove-tag-btn"
                onClick={(e) => removeTag(tag, e)}
                aria-label={`移除标签 ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
