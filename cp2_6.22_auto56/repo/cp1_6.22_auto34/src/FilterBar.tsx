import React, { useState, useEffect, useRef } from 'react';

interface FilterBarProps {
  tags: string[];
  selectedTag: string | null;
  searchQuery: string;
  onSearch: (query: string) => void;
  onTagSelect: (tag: string | null) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  tags,
  selectedTag,
  searchQuery,
  onSearch,
  onTagSelect,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearch(inputValue);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      onTagSelect(null);
    } else {
      onTagSelect(tag);
    }
  };

  return (
    <div className="filter-bar">
      <div className="search-container">
        <svg
          className="search-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="搜索书签标题或摘要..."
          value={inputValue}
          onChange={handleInputChange}
        />
      </div>
      <div className="tags-filter">
        {tags.map(tag => (
          <button
            key={tag}
            className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => handleTagClick(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
