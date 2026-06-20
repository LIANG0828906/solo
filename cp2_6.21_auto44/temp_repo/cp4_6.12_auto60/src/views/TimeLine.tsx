import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiaryStore } from '../store/diaryStore';
import { getEmotionById, formatDate } from '../types';

export default function TimeLine() {
  const navigate = useNavigate();
  const getMonthEntries = useDiaryStore(s => s.getMonthEntries);
  const getEntryByDate = useDiaryStore(s => s.getEntryByDate);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthEntries = useMemo(
    () => getMonthEntries(year, month),
    [year, month, getMonthEntries]
  );

  const entryMap = useMemo(() => {
    const m = new Map<string, typeof monthEntries[0]>();
    monthEntries.forEach(e => m.set(e.date, e));
    return m;
  }, [monthEntries]);

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstWeekday = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleClick = (day: number, isFuture: boolean) => {
    if (isFuture) return;
    const d = new Date(year, month, day);
    const dateStr = formatDate(d);
    navigate(`/edit/${dateStr}`);
  };

  const monthLabel = `${year}年${month + 1}月`;
  const todayStr = formatDate(today);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">情绪时间线</h1>
        <p className="page-subtitle">用色彩记录每一天的心情</p>
      </header>

      <div className="timeline-wrap">
        <div className="month-nav">
          <button className="month-nav-btn" onClick={goPrev} aria-label="上个月">‹</button>
          <span className="month-label">{monthLabel}</span>
          <button className="month-nav-btn" onClick={goNext} aria-label="下个月">›</button>
        </div>

        <div className="timeline-grid" style={{ paddingLeft: `${20 + firstWeekday * 54}px` }}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const d = new Date(year, month, day);
            const dateStr = formatDate(d);
            const entry = entryMap.get(dateStr) || getEntryByDate(dateStr);
            const emotion = entry ? getEmotionById(entry.emotionId) : undefined;
            const isToday = dateStr === todayStr;
            const isFuture = d.getTime() > today.getTime() + 24 * 3600 * 1000 - 1000;
            const classes = [
              'cell',
              !emotion && !isFuture ? '' : '',
              isFuture ? 'cell-empty' : '',
              isToday ? 'cell-today' : ''
            ].filter(Boolean).join(' ');

            return (
              <div
                key={day}
                className={classes}
                style={emotion ? { background: emotion.hsl } : undefined}
                onClick={() => handleClick(day, isFuture)}
              >
                <div className="cell-tooltip">
                  {dateStr}
                  {emotion ? ` · ${emotion.label}` : isFuture ? ' · 未到来' : ' · 未记录'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
