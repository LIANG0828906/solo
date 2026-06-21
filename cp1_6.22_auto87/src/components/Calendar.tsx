import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthDays, formatDate, isSameDay, isSameMonth, getMinutesLevel } from '../utils/date';
import type { StudyRecord } from '../types';
import './Calendar.css';

interface CalendarProps {
  records: StudyRecord[];
  onDateClick: (date: Date) => void;
  updatedDate?: string | null;
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export default function Calendar({ records, onDateClick, updatedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const recordMap = useMemo(() => {
    const map = new Map<string, StudyRecord>();
    records.forEach((r) => map.set(r.date, r));
    return map;
  }, [records]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthLabel = `${year}年${month + 1}月`;

  return (
    <div className="calendar-card glass-card">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth}>
          <ChevronLeft size={20} />
        </button>
        <h2 className="calendar-title">{monthLabel}</h2>
        <button className="calendar-nav-btn" onClick={nextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="weekday-cell">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          const dateStr = formatDate(day);
          const record = recordMap.get(dateStr);
          const level = record ? getMinutesLevel(record.minutes) : 'none';
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, today);
          const isUpdated = updatedDate === dateStr;

          return (
            <div
              key={index}
              className={`day-cell ${!isCurrentMonth ? 'other-month' : ''} ${
                isToday ? 'today' : ''
              } ${isUpdated ? 'updated' : ''}`}
              onClick={() => isCurrentMonth && onDateClick(day)}
            >
              <span className="day-number">{day.getDate()}</span>
              <div className={`day-dot dot-${level}`} />
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="dot dot-none" />
          <span>无记录</span>
        </div>
        <div className="legend-item">
          <div className="dot dot-light" />
          <span>0-30分钟</span>
        </div>
        <div className="legend-item">
          <div className="dot dot-medium" />
          <span>30-60分钟</span>
        </div>
        <div className="legend-item">
          <div className="dot dot-deep" />
          <span>60分钟以上</span>
        </div>
      </div>
    </div>
  );
}
