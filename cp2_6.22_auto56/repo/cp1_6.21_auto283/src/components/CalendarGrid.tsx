import React, { useState, useMemo } from 'react';
import type { Schedule } from '../types';
import ScheduleCard from './ScheduleCard';

interface CalendarGridProps {
  year: number;
  month: number;
  schedules: Schedule[];
  onDayClick: (date: string) => void;
  onScheduleEdit: (schedule: Schedule) => void;
  onScheduleDelete: (id: string) => void;
  onScheduleToggle: (id: string) => void;
  onScheduleDrop: (scheduleId: string, targetDate: string) => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  year,
  month,
  schedules,
  onDayClick,
  onScheduleEdit,
  onScheduleDelete,
  onScheduleToggle,
  onScheduleDrop,
  draggingId,
  setDraggingId
}) => {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: dateStr, day, isCurrentMonth: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: dateStr, day, isCurrentMonth: true });
    }
    
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: dateStr, day, isCurrentMonth: false });
    }
    
    return days;
  }, [year, month]);

  const todayStr = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const getSchedulesForDate = (date: string) => {
    return schedules
      .filter(s => s.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleDragStart = (e: React.DragEvent, schedule: Schedule) => {
    setDraggingId(schedule.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', schedule.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== date) {
      setDragOverDate(date);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    const scheduleId = e.dataTransfer.getData('text/plain');
    if (scheduleId) {
      onScheduleDrop(scheduleId, date);
    }
    setDragOverDate(null);
    setDraggingId(null);
  };

  const handleDayClick = (date: string) => {
    onDayClick(date);
  };

  return (
    <div className="calendar-grid">
      <div className="calendar-weekdays">
        {weekdays.map((day, i) => (
          <div key={i} style={{ color: i === 0 || i === 6 ? '#EF4444' : undefined }}>
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-days">
        {calendarDays.map(({ date, day, isCurrentMonth }) => {
          const daySchedules = getSchedulesForDate(date);
          const isToday = date === todayStr;
          const isDragOver = dragOverDate === date;
          
          return (
            <div
              key={date}
              className={`calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onClick={() => handleDayClick(date)}
              onDragOver={(e) => handleDragOver(e, date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, date)}
            >
              <div className="day-number">{day}</div>
              <div className="day-schedules">
                {daySchedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={onScheduleEdit}
                    onDelete={onScheduleDelete}
                    onToggleComplete={onScheduleToggle}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingId === schedule.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
