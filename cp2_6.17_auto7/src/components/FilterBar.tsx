import { useFontStore } from '@/store/fontStore';
import type { FontCategory, FontTag } from '@/types/font';
import { Search, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';

const CATEGORIES: { value: FontCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部分类' },
  { value: 'serif', label: '衬线体' },
  { value: 'sans-serif', label: '无衬线体' },
  { value: 'handwriting', label: '手写体' },
  { value: 'display', label: '展示体' },
  { value: 'monospace', label: '等宽字体' },
];

const TAG_LABELS: Record<FontTag, string> = {
  poster: '海报',
  body: '正文',
  heading: '标题',
  code: '代码',
  decorative: '装饰',
};

export default function FilterBar() {
  const filter = useFontStore((s) => s.filter);
  const fonts = useFontStore((s) => s.fonts);
  const setFilterCategory = useFontStore((s) => s.setFilterCategory);
  const toggleFilterTag = useFontStore((s) => s.toggleFilterTag);
  const setSearchText = useFontStore((s) => s.setSearchText);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableTags = useMemo(() => {
    const tagSet = new Set<FontTag>();
    fonts.forEach((f) => f.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).map((t) => ({ value: t, label: TAG_LABELS[t] || t }));
  }, [fonts]);

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
    <div className="filter-bar-wrapper">
      <div className="filter-bar">
        <div className="filter-bar__row">
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
        </div>

        <div className="filter-bar__tags-row">
          <span className="filter-bar__tags-label">标签：</span>
          <div className="filter-bar__tags">
            {availableTags.map((tag) => (
              <button
                key={tag.value}
                className={`filter-bar__tag-btn ${filter.tags.includes(tag.value) ? 'filter-bar__tag-btn--active' : ''}`}
                onClick={() => toggleFilterTag(tag.value)}
                title={tag.label}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
