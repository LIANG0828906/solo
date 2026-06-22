import { useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { TrendChart } from './TrendChart';
import { parseDate } from '../utils/nutrition';

function getWeekdayName(date: Date): string {
  const names = ['日', '一', '二', '三', '四', '五', '六'];
  return names[date.getDay()];
}

export function CalendarBar() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const showTrend = useAppStore((s) => s.showTrend);
  const toggleTrend = useAppStore((s) => s.toggleTrend);
  const getLast7DaysData = useAppStore((s) => s.getLast7DaysData);

  const dates = useMemo(() => {
    const today = new Date();
    const days: Array<{
      dateStr: string;
      day: number;
      month: number;
      weekday: string;
      isToday: boolean;
    }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const pad = (n: number) => String(n).padStart(2, '0');
      days.push({
        dateStr: `${y}-${pad(m)}-${pad(day)}`,
        day,
        month: m,
        weekday: getWeekdayName(d),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  const trendData = useMemo(() => getLast7DaysData(), [getLast7DaysData, selectedDate]);

  return (
    <div className="calendar-bar-wrap">
      {showTrend && (
        <div className="trend-panel">
          <div className="trend-panel-header">
            <h3 className="trend-title">近7天热量摄入趋势</h3>
            <button
              className="trend-close"
              onClick={toggleTrend}
              title="关闭"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="trend-chart-container">
            <TrendChart data={trendData} width={760} height={180} />
          </div>
        </div>
      )}

      <div className="calendar-bar">
        <div className="calendar-dates">
          {dates.map((d) => {
            const isSelected = d.dateStr === selectedDate;
            return (
              <button
                key={d.dateStr}
                className={`date-btn ${isSelected ? 'selected' : ''} ${d.isToday ? 'today' : ''}`}
                onClick={() => setSelectedDate(d.dateStr)}
                title={`${d.month}月${d.day}日 周${d.weekday}`}
              >
                <span className="date-weekday">周{d.weekday}</span>
                <span className="date-day">{d.day}</span>
              </button>
            );
          })}
        </div>

        <button
          className={`trend-btn ${showTrend ? 'active' : ''}`}
          onClick={toggleTrend}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>趋势</span>
        </button>
      </div>
    </div>
  );
}

export { parseDate };
