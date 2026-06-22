import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Entry, Mood } from '../types';
import { useEntryStore } from '../store';
import { getMonthKey } from '../utils/dateUtils';
import { useDebounce } from '../utils/debounce';
import EntryCard from './EntryCard';
import { Search } from 'lucide-react';
import { MOOD_CONFIG } from '../types';

interface TimelineProps {
  onEditEntry: (entry: Entry) => void;
}

export default function Timeline({ onEditEntry }: TimelineProps) {
  const { entries, deleteEntry } = useEntryStore(
    useShallow((state) => ({ entries: state.entries, deleteEntry: state.deleteEntry }))
  );

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const debouncedKeyword = useDebounce(searchKeyword, 200);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesKeyword = !debouncedKeyword ||
        entry.title.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
        entry.summary.toLowerCase().includes(debouncedKeyword.toLowerCase());

      const matchesMood = !selectedMood || entry.mood === selectedMood;

      return matchesKeyword && matchesMood;
    });
  }, [entries, debouncedKeyword, selectedMood]);

  const entriesByMonth = useMemo(() => {
    const grouped = new Map<string, Entry[]>();
    filteredEntries.forEach((entry) => {
      const monthKey = getMonthKey(entry.createdAt);
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(entry);
    });
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEntries]);

  const formatMonthTitle = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  const toggleMoodFilter = (mood: Mood) => {
    setSelectedMood(selectedMood === mood ? null : mood);
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜索标题或摘要..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="mood-filters">
          {(Object.keys(MOOD_CONFIG) as Mood[]).map((mood) => (
            <button
              key={mood}
              type="button"
              className={`mood-filter-btn ${selectedMood === mood ? 'active' : ''}`}
              style={{
                '--mood-color': MOOD_CONFIG[mood].color,
                borderColor: selectedMood === mood ? MOOD_CONFIG[mood].color : '#e8e4e0',
                backgroundColor: selectedMood === mood ? `${MOOD_CONFIG[mood].color}15` : '#ffffff',
              } as React.CSSProperties}
              onClick={() => toggleMoodFilter(mood)}
            >
              <span
                className="mood-filter-dot"
                style={{ backgroundColor: MOOD_CONFIG[mood].color }}
              />
              <span className="mood-filter-label">{MOOD_CONFIG[mood].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-content">
        {entriesByMonth.length === 0 ? (
          <div className="empty-state">
            <p>暂无匹配的记录</p>
            <p className="empty-hint">点击右上角"添加条目"开始记录你的数字足迹</p>
          </div>
        ) : (
          entriesByMonth.map(([monthKey, monthEntries]) => (
            <div key={monthKey} className="month-group">
              <h3 className="month-title">
                <span className="timeline-node" />
                {formatMonthTitle(monthKey)}
                <span className="entry-count">({monthEntries.length}条)</span>
              </h3>

              <div className="timeline-line" />

              <div className="entries-list">
                {monthEntries.map((entry) => (
                  <div key={entry.id} className="timeline-item">
                    <EntryCard
                      entry={entry}
                      onEdit={onEditEntry}
                      onDelete={deleteEntry}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
