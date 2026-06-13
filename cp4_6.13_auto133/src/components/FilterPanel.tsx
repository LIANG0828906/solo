import { TimeRange } from '../types';
import './FilterPanel.css';

interface FilterPanelProps {
  keyword: string;
  setKeyword: (value: string) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  timeRange: TimeRange;
  setTimeRange: (value: TimeRange) => void;
  selectedTags: string[];
  onTagFilterChange: (tag: string) => void;
  sentimentFilter: string[];
  onSentimentFilterChange: (sentiment: string) => void;
  availableTags: string[];
  onRefresh: () => void;
  loading: boolean;
}

function FilterPanel({
  keyword,
  setKeyword,
  onSearch,
  onKeyPress,
  timeRange,
  setTimeRange,
  selectedTags,
  onTagFilterChange,
  sentimentFilter,
  onSentimentFilterChange,
  availableTags,
  onRefresh,
  loading
}: FilterPanelProps) {
  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '24h', label: '最近24小时' },
    { value: '7d', label: '最近7天' },
    { value: '30d', label: '最近30天' }
  ];

  const sentimentOptions = [
    { value: 'positive', label: '积极', color: '#10b981' },
    { value: 'neutral', label: '中性', color: '#6b7280' },
    { value: 'negative', label: '消极', color: '#ef4444' }
  ];

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <label className="filter-label">搜索关键词</label>
        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="输入关键词..."
          />
          <button
            className="search-btn"
            onClick={onSearch}
            disabled={loading}
          >
            搜索
          </button>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">时间范围</label>
        <div className="time-range-group">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              className={`time-range-btn ${timeRange === option.value ? 'active' : ''}`}
              onClick={() => setTimeRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">情感筛选</label>
        <div className="checkbox-group">
          {sentimentOptions.map(option => (
            <label key={option.value} className="checkbox-item">
              <input
                type="checkbox"
                checked={sentimentFilter.includes(option.value)}
                onChange={() => onSentimentFilterChange(option.value)}
              />
              <span
                className="checkbox-custom"
                style={{
                  borderColor: option.color,
                  background: sentimentFilter.includes(option.value) ? option.color : 'transparent'
                }}
              ></span>
              <span className="checkbox-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">标签筛选</label>
        <div className="checkbox-group tag-group">
          {availableTags.map(tag => (
            <label key={tag} className="checkbox-item">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => onTagFilterChange(tag)}
              />
              <span
                className={`checkbox-custom ${selectedTags.includes(tag) ? 'checked' : ''}`}
              ></span>
              <span className="checkbox-label">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <button
          className="refresh-btn"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? '刷新中...' : '🔄 刷新数据'}
        </button>
      </div>
    </div>
  );
}

export default FilterPanel;
