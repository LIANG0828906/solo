import React, { useState, useRef, useEffect } from 'react';
import './TagSelector.css';

interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  maxTags?: number;
  onChange: (tags: string[]) => void;
}

const tagColors = ['blue', 'green', 'pink', 'orange', 'purple'];

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  availableTags,
  maxTags = 3,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTagColor = (index: number) => tagColors[index % tagColors.length];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < maxTags) {
      onChange([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !selectedTags.includes(trimmed) && selectedTags.length < maxTags) {
      onChange([...selectedTags, trimmed]);
      setNewTag('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag();
    }
  };

  const unselectedTags = availableTags.filter((t) => !selectedTags.includes(t));

  return (
    <div className="tag-selector" ref={containerRef}>
      <div className="tag-selector__selected">
        {selectedTags.length === 0 && (
          <span className="tag-selector__placeholder">
            选择标签（最多{maxTags}个）
          </span>
        )}
        {selectedTags.map((tag, index) => (
          <span
            key={tag}
            className={`tag tag--${getTagColor(index)}`}
          >
            {tag}
            <button
              type="button"
              className="tag__remove"
              onClick={() => toggleTag(tag)}
              aria-label={`移除标签 ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        {selectedTags.length < maxTags && (
          <button
            type="button"
            className="tag-selector__add-btn"
            onClick={() => setIsOpen(!isOpen)}
          >
            + 添加标签
          </button>
        )}
      </div>

      {isOpen && (
        <div className="tag-selector__dropdown">
          {unselectedTags.length > 0 && (
            <div className="tag-selector__section">
              <div className="tag-selector__section-title">已有标签</div>
              <div className="tag-selector__tag-list">
                {unselectedTags.map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag tag--${getTagColor(selectedTags.length + index)} tag--selectable`}
                    onClick={() => toggleTag(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="tag-selector__section">
            <div className="tag-selector__section-title">创建新标签</div>
            <div className="tag-selector__input-wrap">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入标签名称"
                className="tag-selector__input"
                maxLength={20}
              />
              <button
                type="button"
                className="tag-selector__create-btn"
                onClick={handleAddNewTag}
                disabled={!newTag.trim() || selectedTags.length >= maxTags}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
