import { useEffect, useState } from 'react';
import { TripDataManager } from '../data/TripDataManager';

interface TimelineViewProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export function TimelineView({
  selectedDate,
  onDateSelect,
}: TimelineViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [dates, setDates] = useState<string[]>(() => TripDataManager.getTripDates());
  const [today, setToday] = useState<string>(() => TripDataManager.getToday());

  useEffect(() => {
    return TripDataManager.subscribe(() => {
      setDates(TripDataManager.getTripDates());
      setToday(TripDataManager.getToday());
    });
  }, []);

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return String(d.getDate()).padStart(2, '0');
  };

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const isDatePassed = (dateStr: string) => {
    return dateStr < today;
  };

  const isToday = (dateStr: string) => {
    return dateStr === today;
  };

  return (
    <div
      style={{
        ...styles.container,
        height: expanded ? 160 : 44,
      }}
    >
      <div style={styles.header}>
        <span style={styles.headerTitle}>旅行时间线</span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={styles.toggleBtn}
        >
          {expanded ? '▼ 收起' : '▲ 展开'}
        </button>
      </div>

      {expanded && (
        <div style={styles.timeline}>
          <div style={styles.timelineTrack}>
            <div style={styles.timelineLine} />
            {dates.map((date, index) => (
              <div
                key={date}
                style={{
                  ...styles.nodeContainer,
                  left: `${(index / Math.max(dates.length - 1, 1)) * 100}%`,
                }}
              >
                <div
                  onClick={() => onDateSelect(date)}
                  style={{
                    ...styles.node,
                    backgroundColor: isDatePassed(date)
                      ? '#10B981'
                      : '#9CA3AF',
                    ...(isToday(date) ? styles.todayNode : {}),
                    ...(selectedDate === date ? styles.selectedNode : {}),
                  }}
                >
                  <span style={styles.nodeText}>{formatDateShort(date)}</span>
                </div>
                <div style={styles.dateLabel}>{formatDateFull(date)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    transition: 'height 0.3s ease',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  header: {
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: '1px solid #F3F4F6',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1E3A5F',
  },
  toggleBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6B7280',
    fontSize: 12,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  timeline: {
    padding: '20px 40px',
    position: 'relative',
  },
  timelineTrack: {
    position: 'relative',
    height: 90,
  },
  timelineLine: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  nodeContainer: {
    position: 'absolute',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    top: 0,
  },
  node: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 1,
  },
  todayNode: {
    animation: 'glow 2s ease-in-out infinite',
  },
  selectedNode: {
    transform: 'scale(1.2)',
    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)',
  },
  nodeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 700,
  },
  dateLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    whiteSpace: 'nowrap',
  },
};
