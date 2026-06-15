import { memo, useMemo } from 'react';
import './CalendarHeatmap.css';

interface CalendarHeatmapProps {
  data: { date: string; count: number }[];
  year?: number;
}

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

const getHeatColor = (count: number): string => {
  if (count === 0) return '#fff5f5';
  if (count === 1) return '#ffccd5';
  if (count === 2) return '#ff8fa3';
  return '#e91e63';
};

const getLevel = (count: number): number => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
};

const CalendarHeatmap = memo(function CalendarHeatmap({
  data,
  year = 2026,
}: CalendarHeatmapProps) {
  const calendarData = useMemo(() => {
    const dateMap = new Map<string, number>();
    data.forEach((item) => {
      dateMap.set(item.date, item.count);
    });

    const now = new Date(year, 11, 31);
    const startDate = new Date(year, 0, 1);

    const weeks: {
      date: Date;
      dateStr: string;
      count: number;
      level: number;
      color: string;
    }[][] = [];
    let currentWeek: {
      date: Date;
      dateStr: string;
      count: number;
      level: number;
      color: string;
    }[] = [];

    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyDate = new Date(startDate);
      emptyDate.setDate(startDate.getDate() - (startDayOfWeek - i));
      currentWeek.push({
        date: emptyDate,
        dateStr: '',
        count: 0,
        level: 0,
        color: 'transparent',
      });
    }

    const currentDate = new Date(startDate);
    const endDate = new Date(year, 11, 31);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = dateMap.get(dateStr) || 0;

      currentWeek.push({
        date: new Date(currentDate),
        dateStr,
        count,
        level: getLevel(count),
        color: getHeatColor(count),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        const emptyDate = new Date(currentDate);
        currentWeek.push({
          date: emptyDate,
          dateStr: '',
          count: 0,
          level: 0,
          color: 'transparent',
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [data]);

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    calendarData.forEach((week, weekIndex) => {
      const firstDay = week.find((d) => d.dateStr);
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTH_NAMES[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [calendarData]);

  const totalEntries = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="calendar-heatmap">
      <div className="calendar-stats">
        <span className="calendar-total">
          过去一年共记录 <strong>{totalEntries}</strong> 次美食
        </span>
      </div>

      <div className="calendar-wrapper">
        <div className="calendar-week-labels">
          {WEEK_DAYS.map((day, index) => (
            <span
              key={day}
              className="calendar-week-label"
              style={{ display: index % 2 === 1 ? 'block' : 'none' }}
            >
              {day}
            </span>
          ))}
        </div>

        <div className="calendar-grid-container">
          <div className="calendar-month-labels">
            {monthLabels.map((label) => (
              <span
                key={label.weekIndex}
                className="calendar-month-label"
                style={{ left: `${label.weekIndex * 14 + 4}px` }}
              >
                {label.month}
              </span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarData.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`calendar-day ${day.dateStr ? '' : 'empty'}`}
                    style={{
                      backgroundColor: day.color,
                      animationDelay: `${(weekIndex * 7 + dayIndex) * 0.002}s`,
                    }}
                    title={
                      day.dateStr
                        ? `${day.dateStr}: ${day.count} 次`
                        : ''
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="calendar-legend">
        <span className="legend-label">少</span>
        <div className="legend-colors">
          <div
            className="legend-color"
            style={{ backgroundColor: '#fff5f5' }}
          />
          <div
            className="legend-color"
            style={{ backgroundColor: '#ffccd5' }}
          />
          <div
            className="legend-color"
            style={{ backgroundColor: '#ff8fa3' }}
          />
          <div
            className="legend-color"
            style={{ backgroundColor: '#e91e63' }}
          />
        </div>
        <span className="legend-label">多</span>
      </div>
    </div>
  );
});

export default CalendarHeatmap;
