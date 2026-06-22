import React, { useMemo, useCallback, useState } from 'react';
import { useStore } from '../store';
import { getColor, getMoodLabel, DayData, MoodRecord } from '../hooks/useColorSpectrum';

interface DiaryCardProps {
  record: MoodRecord;
  dayIndex: number;
  onToggleStar: (dayIndex: number, recordId: string) => void;
}

const DiaryCard: React.FC<DiaryCardProps> = React.memo(({ record, dayIndex, onToggleStar }) => {
  const [expanded, setExpanded] = useState(false);
  const recColor = getColor(record.mood);

  const handleStar = useCallback(() => {
    onToggleStar(dayIndex, record.id);
  }, [onToggleStar, dayIndex, record.id]);

  const handleToggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div className="diary-card">
      <div className="diary-accent" style={{ background: recColor.primary }} />
      <div className="diary-body">
        <div className="diary-header">
          <span className="diary-time">{record.time}</span>
          <span className="diary-mood-tag" style={{ color: recColor.primary }}>
            {getMoodLabel(record.mood)}
          </span>
          <button
            className={`diary-star ${record.starred ? 'starred' : ''}`}
            onClick={handleStar}
            aria-label="标星"
          >
            {record.starred ? '★' : '☆'}
          </button>
        </div>
        <h4 className="diary-title">{record.title}</h4>
        <p className="diary-content" onClick={handleToggleExpand}>
          {expanded ? record.content : record.content.slice(0, 50)}
          {!expanded && record.content.length > 50 && '...'}
        </p>
      </div>
    </div>
  );
});

DiaryCard.displayName = 'DiaryCard';

const DiaryList: React.FC = React.memo(() => {
  const weekData = useStore((s) => s.weekData);
  const selectedDayIndex = useStore((s) => s.selectedDayIndex);
  const panelOpen = useStore((s) => s.panelOpen);
  const starredView = useStore((s) => s.starredView);
  const toggleStar = useStore((s) => s.toggleStar);
  const toggleStarredView = useStore((s) => s.toggleStarredView);

  const selectedDay = useMemo(() => {
    if (selectedDayIndex === null) return null;
    return weekData[selectedDayIndex];
  }, [selectedDayIndex, weekData]);

  const starredRecords = useMemo(() => {
    const results: { record: MoodRecord; dayIndex: number; dayData: DayData }[] = [];
    weekData.forEach((day, di) => {
      day.records.forEach((r) => {
        if (r.starred) {
          results.push({ record: r, dayIndex: di, dayData: day });
        }
      });
    });
    return results;
  }, [weekData]);

  if (!panelOpen) return null;

  if (starredView) {
    return (
      <div className="diary-list-panel">
        <div className="diary-list-header">
          <h3 className="diary-list-title">已标星</h3>
          <button className="diary-view-toggle" onClick={toggleStarredView}>
            返回当日
          </button>
        </div>
        {starredRecords.length === 0 ? (
          <div className="diary-empty">暂无标星文记</div>
        ) : (
          <div className="diary-cards">
            {starredRecords.map(({ record, dayIndex, dayData }) => (
              <div key={record.id} className="diary-card-wrapper">
                <div className="diary-card-day-tag">{dayData.date}</div>
                <DiaryCard
                  record={record}
                  dayIndex={dayIndex}
                  onToggleStar={toggleStar}
                />
              </div>
            ))}
          </div>
        )}
        <style>{diaryStyles}</style>
      </div>
    );
  }

  if (!selectedDay) return null;

  return (
    <div className="diary-list-panel">
      <div className="diary-list-header">
        <h3 className="diary-list-title">文记 · {selectedDay.date}</h3>
        <button className="diary-view-toggle" onClick={toggleStarredView}>
          已标星 {starredRecords.length > 0 ? `(${starredRecords.length})` : ''}
        </button>
      </div>
      <div className="diary-cards">
        {selectedDay.records.map((record) => (
          <DiaryCard
            key={record.id}
            record={record}
            dayIndex={selectedDayIndex!}
            onToggleStar={toggleStar}
          />
        ))}
      </div>
      <style>{diaryStyles}</style>
    </div>
  );
});

DiaryList.displayName = 'DiaryList';
export default DiaryList;

const diaryStyles = `
  .diary-list-panel {
    width: 100%;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .diary-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .diary-list-title {
    font-size: 0.9rem;
    font-weight: 500;
    color: #CCC;
  }
  .diary-view-toggle {
    background: rgba(255,255,255,0.06);
    border: none;
    color: #888;
    font-size: 0.75rem;
    padding: 4px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .diary-view-toggle:hover {
    background: rgba(255,255,255,0.12);
    color: #CCC;
  }
  .diary-empty {
    text-align: center;
    color: #555;
    font-size: 0.85rem;
    padding: 24px 0;
  }
  .diary-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .diary-card-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .diary-card-day-tag {
    font-size: 0.7rem;
    color: #666;
    padding-left: 4px;
  }
  .diary-card {
    width: 280px;
    max-width: 100%;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 12px;
    display: flex;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: default;
  }
  .diary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }
  .diary-accent {
    width: 2px;
    flex-shrink: 0;
  }
  .diary-body {
    padding: 12px 14px;
    flex: 1;
    min-width: 0;
  }
  .diary-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .diary-time {
    font-size: 0.7rem;
    color: #666;
  }
  .diary-mood-tag {
    font-size: 0.7rem;
    font-weight: 500;
  }
  .diary-star {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    color: #555;
    transition: transform 0.3s ease, color 0.3s ease;
    padding: 0;
    line-height: 1;
  }
  .diary-star:hover {
    transform: scale(1.2);
  }
  .diary-star.starred {
    color: #FFD700;
    transform: scale(1.2);
  }
  .diary-title {
    font-size: 0.85rem;
    font-weight: 500;
    color: #DDD;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .diary-content {
    font-size: 0.78rem;
    color: #999;
    line-height: 1.5;
    cursor: pointer;
    word-break: break-all;
  }
  .diary-content:hover {
    color: #BBB;
  }
`;
