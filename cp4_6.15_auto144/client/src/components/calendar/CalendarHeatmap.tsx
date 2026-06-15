import { memo, useMemo, useState } from 'react';
import { X, Star, MapPin } from 'lucide-react';
import { FoodJournal } from '../../types';
import { useJournalStore } from '../../store/useJournalStore';
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
  const { entries, openDetail, selectEntry } = useJournalStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const dayEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries.filter((journal) => {
      const journalDate = new Date(journal.createdAt).toISOString().split('T')[0];
      return journalDate === selectedDate;
    });
  }, [selectedDate, entries]);

  const calendarData = useMemo(() => {
    const dateMap = new Map<string, number>();
    data.forEach((item) => {
      dateMap.set(item.date, item.count);
    });

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

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
  }, [data, year]);

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

  const handleDayClick = (dateStr: string, count: number) => {
    if (!dateStr || count === 0) return;
    setSelectedDate(dateStr);
    setShowDayModal(true);
  };

  const handleEntryClick = (entry: FoodJournal) => {
    selectEntry(entry);
    openDetail(entry);
    setShowDayModal(false);
  };

  return (
    <div className="calendar-heatmap">
      <div className="calendar-stats">
        <span className="calendar-total">
          {year}年共记录 <strong>{totalEntries}</strong> 次美食
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
                    className={`calendar-day ${day.dateStr ? (day.count > 0 ? 'clickable' : '') : 'empty'}`}
                    style={{
                      backgroundColor: day.color,
                      animationDelay: `${(weekIndex * 7 + dayIndex) * 0.002}s`,
                    }}
                    title={
                      day.dateStr
                        ? `${day.dateStr}: ${day.count} 次`
                        : ''
                    }
                    onClick={() => handleDayClick(day.dateStr, day.count)}
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

      {showDayModal && selectedDate && (
        <div className="day-modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="day-modal" onClick={(e) => e.stopPropagation()}>
            <div className="day-modal-header">
              <h3>{selectedDate} 的食记</h3>
              <button className="day-modal-close" onClick={() => setShowDayModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="day-modal-content">
              {dayEntries.length === 0 ? (
                <p className="day-empty">当天没有食记</p>
              ) : (
                <div className="day-entry-list">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="day-entry-card"
                      onClick={() => handleEntryClick(entry)}
                    >
                      {entry.photos.length > 0 && (
                        <img
                          src={entry.photos[0]}
                          alt={entry.restaurantName}
                          className="day-entry-thumb"
                        />
                      )}
                      <div className="day-entry-info">
                        <h4 className="day-entry-name">{entry.restaurantName}</h4>
                        <div className="day-entry-meta">
                          <span className="day-entry-rating">
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                            {entry.rating.toFixed(1)}
                          </span>
                          <span className="day-entry-cuisines">
                            {entry.cuisineTags.join('、')}
                          </span>
                        </div>
                        <p className="day-entry-review">
                          {entry.review.length > 50
                            ? entry.review.substring(0, 50) + '...'
                            : entry.review || '暂无评价'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CalendarHeatmap;
