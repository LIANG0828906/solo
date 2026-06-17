import { useState, useEffect, useRef } from 'react';
import type { DiaryEntry } from '../../types';
import { MOOD_CONFIG } from '../../types';
import { useDiaryStore } from '../../store/useDiaryStore';
import DiaryEntryComponent from '../diary/DiaryEntry';

interface CalendarViewProps {
  onEditEntry: (entry: DiaryEntry) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function CalendarView({ onEditEntry }: CalendarViewProps) {
  const { entries, fetchEntriesByMonth, deleteEntry, updateEntry } = useDiaryStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [animatingMonth, setAnimatingMonth] = useState<'prev' | 'next' | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    fetchEntriesByMonth(monthStr);
  }, [year, month, fetchEntriesByMonth]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedDay(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const prevMonth = () => {
    setAnimatingMonth('prev');
    setTimeout(() => {
      setCurrentDate(new Date(year, month - 1, 1));
      setSelectedDay(null);
      setAnimatingMonth(null);
    }, 200);
  };

  const nextMonth = () => {
    setAnimatingMonth('next');
    setTimeout(() => {
      setCurrentDate(new Date(year, month + 1, 1));
      setSelectedDay(null);
      setAnimatingMonth(null);
    }, 200);
  };

  const getEntriesForDay = (dateStr: string) => {
    return entries.filter((e) => e.date === dateStr);
  };

  const getDayMood = (dateStr: string) => {
    const dayEntries = getEntriesForDay(dateStr);
    if (dayEntries.length === 0) return null;
    return dayEntries[0].mood;
  };

  const getTaskProgress = (dateStr: string) => {
    const dayEntries = getEntriesForDay(dateStr);
    let total = 0;
    let completed = 0;
    dayEntries.forEach((e) => {
      total += e.tasks?.length || 0;
      completed += (e.tasks || []).filter((t) => t.completed).length;
    });
    return { total, completed };
  };

  const handleToggleTask = (entryId: string, taskId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const updatedTasks = entry.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateEntry(entryId, { tasks: updatedTasks });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    const today = new Date().toISOString().split('T')[0];

    const calendarCells: JSX.Element[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateObj = new Date(year, month - 1, day);
      const dateStr = dateObj.toISOString().split('T')[0];
      calendarCells.push(
        <div key={`prev-${day}`} className="calendar-day other-month">
          <span className="calendar-day-number">{day}</span>
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split('T')[0];
      const isToday = dateStr === today;
      const dayMood = getDayMood(dateStr);
      const { total, completed } = getTaskProgress(dateStr);
      const isSelected = selectedDay === dateStr;

      const dots = [];
      const dotCount = Math.min(total, 3);
      for (let i = 0; i < dotCount; i++) {
        dots.push(
          <span
            key={i}
            className={`calendar-dot ${i < completed ? 'completed' : ''}`}
          />
        );
      }

      calendarCells.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDay(isSelected ? null : dateStr);
          }}
          style={{ position: 'relative' }}
        >
          <span className="calendar-day-number">{day}</span>
          {dayMood && (
            <span className="calendar-day-mood">{MOOD_CONFIG[dayMood].emoji}</span>
          )}
          {dotCount > 0 && <div className="calendar-day-dots">{dots}</div>}

          {isSelected && (
            <div className="day-popup" ref={popupRef} onClick={(e) => e.stopPropagation()}>
              <div className="day-popup-title">{dateStr} 的日记</div>
              {getEntriesForDay(dateStr).length === 0 ? (
                <div className="day-popup-item-empty">暂无日记</div>
              ) : (
                getEntriesForDay(dateStr).map((entry) => (
                  <div
                    key={entry.id}
                    className="day-popup-item"
                    onClick={() => {
                      setSelectedDay(null);
                      onEditEntry(entry);
                    }}
                  >
                    <span>{MOOD_CONFIG[entry.mood].emoji}</span>
                    <span style={{ flex: 1, fontSize: '13px' }}>{entry.title}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    }

    const remainingCells = 42 - calendarCells.length;
    for (let day = 1; day <= remainingCells; day++) {
      calendarCells.push(
        <div key={`next-${day}`} className="calendar-day other-month">
          <span className="calendar-day-number">{day}</span>
        </div>
      );
    }

    return calendarCells;
  };

  const sortedEntries = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <div className="calendar-container">
        <div className="calendar-header">
          <h2 className="calendar-title">
            {year}年{month + 1}月
          </h2>
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={prevMonth}>
              ← 上月
            </button>
            <button
              className="calendar-nav-btn"
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDay(null);
              }}
            >
              今天
            </button>
            <button className="calendar-nav-btn" onClick={nextMonth}>
              下月 →
            </button>
          </div>
        </div>

        <div
          style={{
            opacity: animatingMonth ? 0 : 1,
            transform: animatingMonth === 'prev' ? 'translateX(-20px)' : animatingMonth === 'next' ? 'translateX(20px)' : 'translateX(0)',
            transition: 'all 0.2s ease'
          }}
        >
          <div className="calendar-grid">
            {WEEKDAYS.map((w) => (
              <div key={w} className="calendar-weekday">
                {w}
              </div>
            ))}
            {renderCalendarDays()}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 className="calendar-title" style={{ marginBottom: '16px' }}>本月日记</h2>
        {sortedEntries.length === 0 ? (
          <div className="no-data">本月还没有日记，开始记录吧！</div>
        ) : (
          <div className="diary-list-wrapper">
            {sortedEntries.map((entry) => (
              <DiaryEntryComponent
                key={entry.id}
                entry={entry}
                onEdit={onEditEntry}
                onDelete={deleteEntry}
                onToggleTask={handleToggleTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
