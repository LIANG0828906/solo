import { useState, useCallback } from 'react';
import { EventBus } from '@/data/EventBus';
import { COLOR_PALETTE, STYLE_OPTIONS } from '@/data/types';
import { Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterPanelProps {
  eventBus: EventBus;
  onAddClick: () => void;
}

export default function FilterPanel({ eventBus, onAddClick }: FilterPanelProps) {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const emitFilter = useCallback(
    (colors: string[], styles: string[], kw: string) => {
      eventBus.emit('filter', { colors, styles, keyword: kw });
    },
    [eventBus]
  );

  const toggleColor = (color: string) => {
    const next = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(next);
    emitFilter(next, selectedStyles, keyword);
  };

  const toggleStyle = (style: string) => {
    const next = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];
    setSelectedStyles(next);
    emitFilter(selectedColors, next, keyword);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    emitFilter(selectedColors, selectedStyles, value);
  };

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedStyles([]);
    setKeyword('');
    emitFilter([], [], '');
  };

  const hasFilters = selectedColors.length > 0 || selectedStyles.length > 0 || keyword.trim().length > 0;

  return (
    <aside className="filter-panel">
      <div className="filter-header">
        <h2 className="filter-title">筛选作品</h2>
        <button
          className="collapse-btn md-hidden"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      <div className={`filter-body ${collapsed ? 'collapsed' : ''}`}>
        <div className="filter-section">
          <label className="filter-label">颜色</label>
          <div className="color-grid">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                className={`color-swatch ${selectedColors.includes(color) ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => toggleColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">风格</label>
          <div className="style-tags">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style}
                className={`style-tag ${selectedStyles.includes(style) ? 'active' : ''}`}
                onClick={() => toggleStyle(style)}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">关键词搜索</label>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="搜索标题或关键词..."
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
            />
          </div>
        </div>

        {hasFilters && (
          <button className="clear-btn" onClick={clearFilters}>
            清除筛选
          </button>
        )}

        <button className="add-btn" onClick={onAddClick}>
          <Plus size={18} />
          添加作品
        </button>
      </div>
    </aside>
  );
}
