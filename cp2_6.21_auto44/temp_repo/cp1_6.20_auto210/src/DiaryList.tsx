import { memo } from 'react';
import { Diary, formatDateShort, stripHtml, groupByWeek, getWeekLabel } from './utils';

interface DiaryListProps {
  diaries: Diary[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onAddClick: () => void;
  newDiaryId: string | null;
}

const DiaryCard = memo(function DiaryCard({
  diary,
  isSelected,
  isNew,
  onClick,
}: {
  diary: Diary;
  isSelected: boolean;
  isNew: boolean;
  onClick: () => void;
}) {
  const previewText = stripHtml(diary.content).slice(0, 60) + '...';

  return (
    <div
      className={`diary-card ${isSelected ? 'selected' : ''} ${isNew ? 'fade-in' : ''}`}
      style={{ ['--card-accent-color' as any]: diary.emotionColor }}
      onClick={onClick}
    >
      <div className="diary-card-header">
        <div
          className="color-dot"
          style={{ backgroundColor: diary.emotionColor }}
        />
        <span className="diary-date">{formatDateShort(diary.date)}</span>
        <span className="diary-title">{diary.title}</span>
      </div>
      <div className="diary-preview">{previewText}</div>
    </div>
  );
});

export default function DiaryList({
  diaries,
  selectedDate,
  onDateSelect,
  onAddClick,
  newDiaryId,
}: DiaryListProps) {
  const weekGroups = groupByWeek(diaries);
  const sortedWeeks = Object.keys(weekGroups).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">日记列表</span>
        <button className="add-btn" onClick={onAddClick} title="新建日记">
          +
        </button>
      </div>
      <div className="diary-list">
        {sortedWeeks.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-text">还没有日记，开始记录吧</div>
          </div>
        ) : (
          sortedWeeks.map(weekStart => (
            <div key={weekStart} className="week-group">
              <div className="week-group-title">{getWeekLabel(weekStart)}</div>
              {weekGroups[weekStart]
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(diary => (
                  <DiaryCard
                    key={diary.id}
                    diary={diary}
                    isSelected={selectedDate === diary.date}
                    isNew={newDiaryId === diary.id}
                    onClick={() => onDateSelect(diary.date)}
                  />
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
