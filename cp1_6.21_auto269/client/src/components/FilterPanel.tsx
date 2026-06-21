import React from 'react';
import { X, Clock, Tag } from 'lucide-react';
import { ALL_TAGS, COOK_TIME_OPTIONS, type CookTimeRange } from '../types';
import './FilterPanel.css';

interface FilterPanelProps {
  selectedTags: string[];
  cookTimeRange: CookTimeRange;
  onTagsChange: (tags: string[]) => void;
  onCookTimeChange: (range: CookTimeRange) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedTags,
  cookTimeRange,
  onTagsChange,
  onCookTimeChange,
  isOpen = true,
  onClose
}) => {
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleClearFilters = () => {
    onTagsChange([]);
    onCookTimeChange('');
  };

  const hasActiveFilters = selectedTags.length > 0 || cookTimeRange !== '';

  return (
    <>
      {isOpen && onClose && (
        <div className="filter-overlay" onClick={onClose} />
      )}
      <aside className={`filter-panel ${isOpen ? 'open' : ''}`}>
        <div className="filter-panel-header">
          <h3 className="filter-title">筛选</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose} aria-label="关闭">
              <X size={20} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button className="clear-btn" onClick={handleClearFilters}>
            清除所有筛选
          </button>
        )}

        <div className="filter-section">
          <div className="filter-section-title">
            <Clock size={16} />
            <span>烹饪时长</span>
          </div>
          <div className="filter-options">
            {COOK_TIME_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`filter-option ${cookTimeRange === option.value ? 'active' : ''}`}
                onClick={() => onCookTimeChange(cookTimeRange === option.value ? '' : option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-section-title">
            <Tag size={16} />
            <span>标签分类</span>
          </div>
          <div className="tag-list">
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                className={`tag-item ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

export default FilterPanel;
