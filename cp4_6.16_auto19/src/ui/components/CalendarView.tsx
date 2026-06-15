import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Activity, Boardgame } from '@/types';
import styles from './CalendarView.module.css';

interface CalendarViewProps {
  activities: Activity[];
  boardgames: Boardgame[];
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function CalendarView({ activities, boardgames }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const navigate = useNavigate();

  const boardgameMap = useMemo(() => {
    const map = new Map<string, Boardgame>();
    boardgames.forEach((g) => map.set(g.id, g));
    return map;
  }, [boardgames]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = firstDayOfWeek;

  const allDays = useMemo(() => {
    const result: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = paddingDays - 1; i >= 0; i--) {
      const d = new Date(monthStart);
      d.setDate(d.getDate() - i - 1);
      result.push({ date: d, isCurrentMonth: false });
    }
    days.forEach((d) => result.push({ date: d, isCurrentMonth: true }));
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(monthEnd);
      d.setDate(d.getDate() + i);
      result.push({ date: d, isCurrentMonth: false });
    }
    return result;
  }, [days, paddingDays, monthStart, monthEnd]);

  const getActivitiesForDate = (date: Date) => {
    return activities.filter((a) => isSameDay(new Date(a.dateTime), date));
  };

  const selectedActivities = selectedDate ? getActivitiesForDate(selectedDate) : [];

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const handleActivityClick = (activityId: string) => {
    navigate(`/activity/${activityId}`);
  };

  const today = new Date();

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={handlePrevMonth} aria-label="上个月">
          ‹
        </button>
        <h2 className={styles.title}>
          {format(currentDate, 'yyyy年 M月', { locale: zhCN })}
        </h2>
        <button className={styles.navBtn} onClick={handleNextMonth} aria-label="下个月">
          ›
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.days}>
        {allDays.map(({ date, isCurrentMonth }, index) => {
          const dayActivities = getActivitiesForDate(date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

          return (
            <div
              key={index}
              className={`${styles.dayCell} ${
                !isCurrentMonth ? styles.otherMonth : ''
              } ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
              onClick={() => isCurrentMonth && handleDayClick(date)}
            >
              <span className={styles.dayNumber}>{date.getDate()}</span>
              {dayActivities.length > 0 && (
                <div className={styles.dots}>
                  {dayActivities.slice(0, 3).map((activity, i) => (
                    <span
                      key={activity.id}
                      className={styles.dot}
                      style={{ animationDelay: `${0.05 * i}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className={styles.dayActivities}>
          <h3 className={styles.dayActivitiesTitle}>
            {format(selectedDate, 'M月d日 EEEE', { locale: zhCN })} 的活动
          </h3>
          {selectedActivities.length > 0 ? (
            selectedActivities.map((activity) => {
              const game = boardgameMap.get(activity.boardgameId);
              return (
                <div
                  key={activity.id}
                  className={styles.activityItem}
                  onClick={() => handleActivityClick(activity.id)}
                >
                  <span className={styles.activityEmoji}>{game?.emoji || '🎲'}</span>
                  <div className={styles.activityInfo}>
                    <div className={styles.activityName}>{activity.title}</div>
                    <div className={styles.activityTime}>
                      {format(new Date(activity.dateTime), 'HH:mm')} · {activity.location}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>当天暂无活动</div>
          )}
        </div>
      )}
    </div>
  );
}
