import { useState, useRef, useEffect } from 'react';
import { PRESET_TAGS, TAG_COLORS } from '../types';
import type { Tag } from '../types';

interface TagFilterProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

export default function TagFilter({ selectedTags, onChange }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTag = (tag: Tag) => {
    onChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  };

  const clearAll = () => onChange([]);

  return (
    <div className="tag-filter" ref={containerRef}>
      <span className="tag-filter-label">标签筛选：</span>
      <button
        className={`filter-btn ${selectedTags.length > 0 ? 'active' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
      >
        {selectedTags.length === 0 ? '全部标签' : `已选 ${selectedTags.length} 个`}
        <span style={{ marginLeft: '4px' }}>▾</span>
      </button>
      {isOpen && (
        <div className="tag-filter-dropdown">
          {PRESET_TAGS.map((tag) => (
            <div
              key={tag}
              className="tag-filter-option"
              onClick={() => toggleTag(tag)}
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
                style={{ accentColor: TAG_COLORS[tag] }}
              />
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: TAG_COLORS[tag],
                }}
              />
              <span>{tag}</span>
            </div>
          ))}
          {selectedTags.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #f0f0f0',
                textAlign: 'center',
              }}
            >
              <button
                className="secondary"
                style={{ padding: '4px 12px', fontSize: '12px' }}
                onClick={clearAll}
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
