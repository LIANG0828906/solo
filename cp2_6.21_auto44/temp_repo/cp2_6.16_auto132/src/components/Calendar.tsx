import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { usePlantStore } from '../store/plantStore';
import {
  generateCalendarDays,
  getMonthLabel,
  getWeekdayLabels,
  navigateMonth,
  CARE_TYPE_COLORS,
  CARE_TYPE_LABELS,
  CARE_TYPE_ICONS,
  CalendarDay,
  CalendarEvent
} from '../utils/calendarHelper';

const DayEventsModal = ({
  isOpen,
  onClose,
  day,
  onToggleComplete
}: {
  isOpen: boolean;
  onClose: () => void;
  day: CalendarDay | null;
  onToggleComplete: (recordId: string) => void;
}) => {
  if (!isOpen || !day) return null;

  const hasIncomplete = day.events.some(e => !e.completed);
  const allCompleted = day.events.length > 0 && day.events.every(e => e.completed);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="animate-slide-up">
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>
              📅 {format(day.date, 'MM月dd日 EEEE', { locale: zhCN })}
            </h2>
            <p style={styles.modalSubtitle}>
              {day.events.length} 项养护任务
              {allCompleted && <span style={styles.allDoneTag}>✓ 全部完成</span>}
            </p>
          </div>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.eventList}>
          {day.events.length === 0 ? (
            <div style={styles.emptyEvents}>
              <span style={styles.emptyIcon}>🌿</span>
              <p style={styles.emptyText}>今天没有养护任务</p>
              <p style={styles.emptyHint}>好好享受这一天吧！</p>
            </div>
          ) : (
            day.events.map((event, index) => (
              <div
                key={event.recordId}
                style={{
                  ...styles.eventItem,
                  opacity: event.completed ? 0.6 : 1,
                  animationDelay: `${index * 0.05}s`
                }}
                className="animate-fade-in"
              >
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={event.completed}
                    onChange={() => onToggleComplete(event.recordId)}
                    style={styles.checkbox}
                  />
                  <div style={styles.customCheckbox}>
                    {event.completed && <span style={styles.checkmark}>✓</span>}
                  </div>
                </label>

                <div style={styles.eventContent}>
                  <div style={styles.eventHeader}>
                    <span style={{
                      ...styles.eventType,
                      backgroundColor: CARE_TYPE_COLORS[event.type] + '20',
                      color: CARE_TYPE_COLORS[event.type]
                    }}>
                      {CARE_TYPE_ICONS[event.type]} {CARE_TYPE_LABELS[event.type]}
                    </span>
                    <span style={styles.eventPlant}>{event.plantName}</span>
                  </div>
                  {event.notes && (
                    <p style={styles.eventNotes}>{event.notes}</p>
                  )}
                </div>

                <div style={{
                  ...styles.eventStatus,
                  backgroundColor: event.completed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                  color: event.completed ? 'var(--status-green)' : 'var(--status-yellow)'
                }}>
                  {event.completed ? '已完成' : '待完成'}
                </div>
              </div>
            ))
          )}
        </div>

        {hasIncomplete && (
          <div style={styles.modalFooter}>
            <p style={styles.footerHint}>
              💡 完成任务后勾选复选框，记录将自动同步到植物时间轴
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Calendar = () => {
  const plants = usePlantStore((state) => state.plants);
  const careRecords = usePlantStore((state) => state.careRecords);
  const toggleRecordCompletion = usePlantStore((state) => state.toggleRecordCompletion);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentDate, careRecords, plants);
  }, [currentDate, careRecords, plants]);

  const stats = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayEvents = careRecords.filter(r => r.date === todayStr);
    const incompleteToday = todayEvents.filter(r => !r.completed).length;
    const upcoming = careRecords.filter(r => {
      const recordDate = new Date(r.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return recordDate >= today && !r.completed;
    }).length;

    return {
      totalTasks: todayEvents.length,
      incompleteToday,
      upcoming
    };
  }, [careRecords]);

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const handleToggleComplete = (recordId: string) => {
    toggleRecordCompletion(recordId);
    if (selectedDay) {
      const updatedDay = calendarDays.find(d => d.dateStr === selectedDay.dateStr);
      if (updatedDay) {
        setSelectedDay(updatedDay);
      }
    }
  };

  const weekdayLabels = getWeekdayLabels();

  const getDayEventsColor = (day: CalendarDay): string[] => {
    const colors: string[] = [];
    const types = new Set(day.events.map(e => e.type));
    types.forEach(type => {
      colors.push(CARE_TYPE_COLORS[type]);
    });
    return colors.slice(0, 3);
  };

  const hasIncompleteEvents = (day: CalendarDay): boolean => {
    return day.events.some(e => !e.completed);
  };

  const allEventsCompleted = (day: CalendarDay): boolean => {
    return day.events.length > 0 && day.events.every(e => e.completed);
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>养护日历</h1>
          <p style={styles.subtitle}>
            今日待办：{stats.incompleteToday} 项 · 未来待办：{stats.upcoming} 项
          </p>
        </div>

        <div style={styles.legend}>
          {Object.entries(CARE_TYPE_LABELS).map(([type, label]) => (
            <div key={type} style={styles.legendItem}>
              <div style={{
                ...styles.legendDot,
                backgroundColor: CARE_TYPE_COLORS[type]
              }} />
              <span style={styles.legendText}>{CARE_TYPE_ICONS[type]} {label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.calendarCard}>
        <div style={styles.calendarHeader}>
          <button
            style={styles.navBtn}
            onClick={() => setCurrentDate(navigateMonth(currentDate, 'prev'))}
          >
            ←
          </button>
          <h2 style={styles.monthLabel}>{getMonthLabel(currentDate)}</h2>
          <button
            style={styles.navBtn}
            onClick={() => setCurrentDate(navigateMonth(currentDate, 'next'))}
          >
            →
          </button>
        </div>

        <div style={styles.weekdayRow}>
          {weekdayLabels.map((day, index) => (
            <div
              key={day}
              style={{
                ...styles.weekdayCell,
                color: index === 0 || index === 6 ? 'var(--status-red)' : 'var(--text-secondary)'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        <div style={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            const eventColors = getDayEventsColor(day);
            const hasIncomplete = hasIncompleteEvents(day);
            const allCompleted = allEventsCompleted(day);

            return (
              <div
                key={`${day.dateStr}-${index}`}
                style={{
                  ...styles.dayCell,
                  opacity: day.isCurrentMonth ? 1 : 0.3,
                  backgroundColor: day.isToday
                    ? 'rgba(107, 142, 35, 0.1)'
                    : hasIncomplete
                    ? 'rgba(255, 193, 7, 0.05)'
                    : allCompleted
                    ? 'rgba(76, 175, 80, 0.05)'
                    : 'transparent',
                  borderColor: day.isToday
                    ? 'var(--primary-green)'
                    : allCompleted
                    ? 'var(--status-green)'
                    : 'transparent'
                }}
                onClick={() => day.isCurrentMonth && handleDayClick(day)}
              >
                <span style={{
                  ...styles.dayNumber,
                  color: day.isToday ? 'var(--primary-green)' : 'var(--text-primary)',
                  fontWeight: day.isToday ? 700 : 400
                }}>
                  {format(day.date, 'd')}
                </span>

                {day.events.length > 0 && (
                  <div style={styles.eventDots}>
                    {eventColors.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.eventDot,
                          backgroundColor: color,
                          opacity: allCompleted ? 0.5 : 1
                        }}
                      />
                    ))}
                    {day.events.length > 3 && (
                      <span style={styles.eventCount}>+{day.events.length - 3}</span>
                    )}
                  </div>
                )}

                {hasIncomplete && (
                  <div style={styles.incompleteBadge}>!</div>
                )}

                {allCompleted && (
                  <div style={styles.completedCheck}>✓</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DayEventsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        day={selectedDay}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  legend: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  legendText: {
    fontSize: '13px',
    color: 'var(--text-secondary)'
  },
  calendarCard: {
    backgroundColor: 'var(--card-bg)',
    border: '2px solid var(--border-color)',
    borderRadius: '14px',
    padding: '24px',
    overflow: 'hidden'
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  navBtn: {
    width: '40px',
    height: '40px',
    border: '1px solid rgba(107, 142, 35, 0.2)',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    fontSize: '16px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthLabel: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '8px'
  },
  weekdayCell: {
    textAlign: 'center' as const,
    fontSize: '12px',
    fontWeight: 500,
    padding: '8px'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px'
  },
  dayCell: {
    aspectRatio: '1',
    border: '2px solid',
    borderRadius: '10px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative' as const,
    minHeight: '80px'
  },
  dayNumber: {
    fontSize: '14px',
    marginBottom: '4px'
  },
  eventDots: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    marginTop: 'auto'
  },
  eventDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%'
  },
  eventCount: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginLeft: '2px'
  },
  incompleteBadge: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    width: '16px',
    height: '16px',
    backgroundColor: 'var(--status-yellow)',
    color: 'white',
    borderRadius: '50%',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  completedCheck: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    fontSize: '12px',
    color: 'var(--status-green)'
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(107, 142, 35, 0.1)'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  modalSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  allDoneTag: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: 'var(--status-green)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  eventList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 24px'
  },
  emptyEvents: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center' as const
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  emptyHint: {
    fontSize: '13px',
    color: 'var(--text-muted)'
  },
  eventItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'rgba(107, 142, 35, 0.03)',
    borderRadius: '10px',
    marginBottom: '8px',
    transition: 'all 0.3s ease',
    opacity: 0,
    animationFillMode: 'forwards' as const
  },
  checkboxLabel: {
    position: 'relative' as const,
    cursor: 'pointer',
    marginTop: '2px'
  },
  checkbox: {
    position: 'absolute' as const,
    opacity: 0,
    cursor: 'pointer'
  },
  customCheckbox: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(107, 142, 35, 0.3)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backgroundColor: 'white'
  },
  checkmark: {
    color: 'var(--status-green)',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  eventContent: {
    flex: 1,
    minWidth: 0
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
    flexWrap: 'wrap' as const
  },
  eventType: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500
  },
  eventPlant: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  eventNotes: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  eventStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(107, 142, 35, 0.1)',
    backgroundColor: 'rgba(107, 142, 35, 0.02)'
  },
  footerHint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const
  }
};

export default Calendar;
