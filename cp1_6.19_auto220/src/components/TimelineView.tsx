import { useMemo } from 'react';
import { useDiaryStore } from '../store';
import TimelineCard from './TimelineCard';
import { Search, Check } from 'lucide-react';
import { EMOTION_PALETTES } from '../types';
import type { EmotionType } from '../types';

export default function TimelineView() {
  const searchQuery = useDiaryStore((s) => s.searchQuery);
  const filterEmotion = useDiaryStore((s) => s.filterEmotion);
  const setSearchQuery = useDiaryStore((s) => s.setSearchQuery);
  const setFilterEmotion = useDiaryStore((s) => s.setFilterEmotion);
  const getFilteredEntries = useDiaryStore((s) => s.getFilteredEntries);

  const entries = useMemo(() => getFilteredEntries(), [getFilteredEntries, searchQuery, filterEmotion]);

  const toggleFilter = (emotion: EmotionType) => {
    setFilterEmotion(filterEmotion === emotion ? null : emotion);
  };

  return (
    <div className="timeline-container">
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索日记内容或日期…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          {EMOTION_PALETTES.map((p) => {
            const isActive = filterEmotion === p.type;
            return (
              <button
                key={p.type}
                className={`filter-btn ${isActive ? 'active' : ''}`}
                data-emotion={p.type}
                onClick={() => toggleFilter(p.type)}
                style={!isActive ? { borderColor: p.color, color: p.color } : undefined}
              >
                {isActive && <Check size={14} strokeWidth={3} />}
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="timeline-grid">
        {entries.length === 0 ? (
          <div className="empty-state">
            暂无日记，前往编辑页挥毫泼墨吧～
          </div>
        ) : (
          entries.map((entry) => <TimelineCard key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
