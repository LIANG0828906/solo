import React, { useMemo } from 'react';
import { getLast12Months, getMonthDays, formatDate } from '../utils/dateUtils';
import './CalendarHeatmap.css';

interface CalendarHeatmapProps {
  getDailyCalories: (date: string) => number;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ getDailyCalories }) => {
  const months = useMemo(() => getLast12Months(), []);

  const getHeatLevel = (calories: number): number => {
    if (calories === 0) return 0;
    if (calories < 200) return 1;
    if (calories < 400) return 2;
    if (calories < 600) return 3;
    if (calories < 800) return 4;
    return 5;
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="calendar-heatmap-container">
      <div className="heatmap-scroll-wrapper">
        <div className="heatmap-months">
          {months.map((month, monthIndex) => {
            const days = getMonthDays(month.year, month.month);
            const firstDay = days[0];
            const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
            
            return (
              <div key={monthIndex} className="heatmap-month">
                <div className="month-title">{month.label}</div>
                <div className="weekday-labels">
                  {weekDays.map((day, i) => (
                    <div key={i} className="weekday-label">{day}</div>
                  ))}
                </div>
                <div className="heatmap-grid">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="heatmap-cell empty" />
                  ))}
                  {days.map((date) => {
                    const dateStr = formatDate(date);
                    const calories = getDailyCalories(dateStr);
                    const level = getHeatLevel(calories);
                    
                    return (
                      <div
                        key={dateStr}
                        className={`heatmap-cell level-${level}`}
                        title={`${dateStr}\n消耗: ${calories} 卡路里`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="heatmap-legend">
        <span className="legend-label">少</span>
        <div className="legend-cells">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <div key={level} className={`heatmap-cell level-${level}`} />
          ))}
        </div>
        <span className="legend-label">多</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
