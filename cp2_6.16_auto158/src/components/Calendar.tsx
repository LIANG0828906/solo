import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { Course } from '@/types';
import { getDaysInMonth, getFirstDayOfMonth, getMonthName, isSameDay, formatTime } from '@/utils/dateUtils';

interface CalendarProps {
  courses: Course[];
  onDateClick?: (date: Date) => void;
  onCourseClick?: (course: Course) => void;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  courses,
  onDateClick,
  onCourseClick,
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [year, month, daysInMonth, firstDay]);

  const getCoursesForDate = (date: Date) => {
    return courses.filter((course) => isSameDay(course.startTime, date));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();

  const getCourseColor = (course: Course) => {
    const colors = [
      'bg-accent/90 text-white',
      'bg-blue-500/90 text-white',
      'bg-green-500/90 text-white',
      'bg-purple-500/90 text-white',
      'bg-pink-500/90 text-white',
    ];
    const hash = course.studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={twMerge('bg-white rounded-card shadow-card p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {year}年 {getMonthName(month)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-bg-primary transition-colors duration-fast text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-bg-primary transition-colors duration-fast text-text-secondary hover:text-text-primary"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={twMerge(
              'text-center text-sm font-medium py-2',
              index === 0 || index === 6 ? 'text-error' : 'text-text-secondary'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-24" />;
          }

          const dayCourses = getCoursesForDate(date);
          const isToday = isSameDay(date, today);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={date.toISOString()}
              onClick={() => onDateClick?.(date)}
              className={twMerge(
                'h-24 p-1.5 rounded-lg border border-transparent',
                'cursor-pointer transition-all duration-fast',
                'hover:border-accent hover:bg-accent-light/30',
                isToday && 'bg-accent-light/50 border-accent',
                !isToday && 'hover:bg-bg-hover'
              )}
            >
              <div
                className={twMerge(
                  'text-sm font-medium mb-1',
                  isToday && 'text-accent',
                  !isToday && isWeekend && 'text-error',
                  !isToday && !isWeekend && 'text-text-primary'
                )}
              >
                {date.getDate()}
              </div>
              <div className="space-y-1 overflow-hidden">
                {dayCourses.slice(0, 2).map((course) => (
                  <div
                    key={course.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCourseClick?.(course);
                    }}
                    className={twMerge(
                      'text-xs px-1.5 py-0.5 rounded truncate',
                      getCourseColor(course)
                    )}
                  >
                    {formatTime(course.startTime)}
                  </div>
                ))}
                {dayCourses.length > 2 && (
                  <div className="text-xs text-text-muted">
                    +{dayCourses.length - 2} 更多
                  </div>
                )}
              </div>
              {dayCourses.length === 0 && (
                <div className="flex items-center justify-center h-10 opacity-0 hover:opacity-100 transition-opacity duration-fast">
                  <Plus size={16} className="text-text-muted" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
