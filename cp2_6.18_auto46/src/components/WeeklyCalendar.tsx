import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { getWeeklyCalendarData, type WeeklyDayData } from '../modules/progressTracker';

interface WeeklyCalendarProps {
  userId: string;
  userName: string;
}

export default function WeeklyCalendar({ userId, userName }: WeeklyCalendarProps) {
  const checkins = useAppStore(state => state.checkins);

  const weekData: WeeklyDayData[] = useMemo(
    () => getWeeklyCalendarData(checkins, userId),
    [checkins, userId]
  );

  const completedCount = weekData.filter(d => d.status === 'completed').length;
  const totalMinutes = weekData.reduce((sum, d) => sum + d.duration, 0);

  const getStatusIcon = (status: WeeklyDayData['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'missed':
        return '✕';
      case 'pending':
        return '—';
    }
  };

  const getStatusClass = (status: WeeklyDayData['status']) => {
    switch (status) {
      case 'completed':
        return 'weekly-cell completed';
      case 'missed':
        return 'weekly-cell missed';
      case 'pending':
        return 'weekly-cell pending';
    }
  };

  return (
    <div className="weekly-calendar-card">
      <div className="weekly-calendar-header">
        <div>
          <div className="weekly-calendar-title">{userName} - 本周打卡日历</div>
          <div className="weekly-calendar-subtitle">
            完成 <span style={{ color: '#22C55E', fontWeight: 700 }}>{completedCount}</span>/7 天
            &nbsp;·&nbsp; 累计学习 <span style={{ color: '#3B82F6', fontWeight: 700 }}>{totalMinutes}</span> 分钟
          </div>
        </div>
        <div className="weekly-legend">
          <span className="weekly-legend-item">
            <span className="weekly-legend-dot completed-dot"></span> 已完成
          </span>
          <span className="weekly-legend-item">
            <span className="weekly-legend-dot missed-dot"></span> 未完成
          </span>
          <span className="weekly-legend-item">
            <span className="weekly-legend-dot pending-dot"></span> 待打卡
          </span>
        </div>
      </div>

      <div className="weekly-grid">
        {weekData.map(day => (
          <div key={day.dateKey} className="weekly-day-col">
            <div className="weekly-day-name">{day.dayName}</div>
            <div
              className={`${getStatusClass(day.status)} ${day.isToday ? 'is-today' : ''}`}
              title={`${day.dateKey}${day.duration > 0 ? ` · ${day.duration}分钟` : ''}`}
            >
              <span className="weekly-cell-icon">{getStatusIcon(day.status)}</span>
            </div>
            <div className="weekly-day-number">{day.dayNumber}日</div>
            {day.duration > 0 && (
              <div className="weekly-day-duration">{day.duration}分</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
