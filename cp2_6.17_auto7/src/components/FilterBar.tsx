import { useFontStore } from '@/store/fontStore';
import type { FontCategory, FontTag } from '@/types/font';
import { Search, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const CATEGORIES: { value: FontCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部分类' },
  { value: 'serif', label: '衬线' },
  { value: 'sans-serif', label: '无衬线' },
  { value: 'handwriting', label: '手写' },
  { value: 'monospace', label: '等宽' },
  { value: 'display', label: '显示' },
];

const TAGS: { value: FontTag; label: string }[] = [
  { value: 'poster', label: '海报' },
  { value: 'body', label: '正文' },
  { value: 'heading', label: '标题' },
  { value: 'code', label: '代码' },
  { value: 'decorative', label: '装饰' },
];

export default function FilterBar() {
  const filter = useFontStore((s) => s.filter);
  const setFilterCategory = useFontStore((s) => s.setFilterCategory);
  const toggleFilterTag = useFontStore((s) => s.toggleFilterTag);
  const setSearchText = useFontStore((s) => s.setSearchText);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCategoryLabel = CATEGORIES.find((c) => c.value === filter.category)?.label || '全部分类';

  return (
    <div className="filter-bar">
      <div className="filter-bar__left">
        <div className="filter-bar__dropdown" ref={dropdownRef}>
          <button
            className="filter-bar__dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {currentCategoryLabel}
            <ChevronDown size={16} className={`filter-bar__dropdown-icon ${dropdownOpen ? 'filter-bar__dropdown-icon--open' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="filter-bar__dropdown-menu">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`filter-bar__dropdown-item ${filter.category === cat.value ? 'filter-bar__dropdown-item--active' : ''}`}
                  onClick={() => {
                    setFilterCategory(cat.value);
                    setDropdownOpen(false);
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="filter-bar__tags">
          {TAGS.map((tag) => (
            <button
              key={tag.value}
              className={`filter-bar__tag-btn ${filter.tags.includes(tag.value) ? 'filter-bar__tag-btn--active' : ''}`}
              onClick={() => toggleFilterTag(tag.value)}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__search">
        <Search size={16} className="filter-bar__search-icon" />
        <input
          type="text"
          className="filter-bar__search-input"
          placeholder="搜索字体名称..."
          value={filter.searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
    </div>
  );
}
