import { useMemo } from 'react';
import { useMoodStore } from '../store';
import { MOOD_COLORS, MOOD_EMOJIS, getEntriesByDate } from '../data';

function InfoCard() {
  const selectedElement = useMoodStore((state) => state.selectedElement);
  const setSelectedElement = useMoodStore((state) => state.setSelectedElement);
  const weekEntries = useMoodStore((state) => state.weekEntries);

  const diaryEntries = useMemo(() => {
    if (!selectedElement) return [];
    return getEntriesByDate(weekEntries, selectedElement.date).slice(0, 5);
  }, [selectedElement, weekEntries]);

  if (!selectedElement) return null;

  const moodColor = MOOD_COLORS[selectedElement.mood];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日 ${days[date.getDay()]}`;
  };

  const handleClose = () => {
    setSelectedElement(null);
  };

  return (
    <div
      className="info-card"
      style={{
        top: `${selectedElement.y}%`,
        marginTop: selectedElement.size / 2 + 10,
      }}
    >
      <div className="info-card__bar" style={{ background: moodColor }} />

      <div className="info-card__header">
        <span className="info-card__date">{formatDate(selectedElement.date)}</span>
        <button className="info-card__close" onClick={handleClose}>
          ×
        </button>
      </div>

      <div className="info-card__list">
        {diaryEntries.length > 0 ? (
          diaryEntries.map((entry) => (
            <div key={entry.id} className="diary-item">
              <div className="diary-item__header">
                <span className="diary-item__mood">{MOOD_EMOJIS[entry.mood]}</span>
                <span className="diary-item__time">{entry.timestamp}</span>
              </div>
              <p className="diary-item__content">{entry.content}</p>
            </div>
          ))
        ) : (
          <div className="empty-state">暂无日记记录</div>
        )}
      </div>
    </div>
  );
}

export default InfoCard;
