import React, { useMemo, memo } from 'react';
import { Booking } from '../store/bookingStore';

interface ResourceTimelineProps {
  bookings: Booking[];
}

interface TimelineDay {
  date: Date;
  dateKey: string;
  label: string;
}

interface ResourceGroup {
  key: string;
  resourceType: 'desk' | 'room';
  resourceId: string;
  bookings: Booking[];
}

const DESK_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8', bar: '#3B82F6' },
  { bg: '#FCE7F3', text: '#BE185D', bar: '#EC4899' },
  { bg: '#CCFBF1', text: '#0F766E', bar: '#14B8A6' },
  { bg: '#FEF3C7', text: '#92400E', bar: '#F59E0B' },
  { bg: '#E0E7FF', text: '#4338CA', bar: '#6366F1' },
];

const ROOM_COLORS = [
  { bg: '#EDE9FE', text: '#6D28D9', bar: '#8B5CF6' },
  { bg: '#FEE2E2', text: '#B91C1C', bar: '#EF4444' },
  { bg: '#CFFAFE', text: '#155E75', bar: '#06B6D4' },
  { bg: '#D1FAE5', text: '#065F46', bar: '#10B981' },
  { bg: '#FFEDD5', text: '#9A3412', bar: '#F97316' },
];

const ResourceTimeline: React.FC<ResourceTimelineProps> = memo(({ bookings }) => {
  const days = useMemo<TimelineDay[]>(() => {
    const result: TimelineDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const label = i === 0 ? '今天' : i === 1 ? '明天' : weekdays[d.getDay()];
      result.push({ date: d, dateKey: key, label: `${label} ${d.getMonth() + 1}/${d.getDate()}` });
    }
    return result;
  }, []);

  const resourceGroups = useMemo<ResourceGroup[]>(() => {
    const map = new Map<string, ResourceGroup>();
    bookings.forEach((b) => {
      const key = `${b.resourceType}-${b.resourceId}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          resourceType: b.resourceType,
          resourceId: b.resourceId,
          bookings: [],
        });
      }
      map.get(key)!.bookings.push(b);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.resourceType !== b.resourceType) return a.resourceType.localeCompare(b.resourceType);
      return a.resourceId.localeCompare(b.resourceId);
    });
  }, [bookings]);

  const colorMap = useMemo(() => {
    const map = new Map<string, { bg: string; text: string; bar: string }>();
    let deskIdx = 0;
    let roomIdx = 0;
    resourceGroups.forEach((g) => {
      if (g.resourceType === 'desk') {
        map.set(g.key, DESK_COLORS[deskIdx % DESK_COLORS.length]);
        deskIdx++;
      } else {
        map.set(g.key, ROOM_COLORS[roomIdx % ROOM_COLORS.length]);
        roomIdx++;
      }
    });
    return map;
  }, [resourceGroups]);

  const HOUR_START = 8;
  const HOUR_END = 22;
  const TOTAL_HOURS = HOUR_END - HOUR_START;

  const toPercent = (date: Date, day: Date): number | null => {
    if (date.toDateString() !== day.toDateString()) return null;
    const hours = date.getHours() + date.getMinutes() / 60;
    return Math.max(0, Math.min(100, ((hours - HOUR_START) / TOTAL_HOURS) * 100));
  };

  const getBookingPosition = (booking: Booking, day: TimelineDay) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const dayStart = new Date(day.date);
    dayStart.setHours(HOUR_START, 0, 0, 0);
    const dayEnd = new Date(day.date);
    dayEnd.setHours(HOUR_END, 0, 0, 0);

    const effStart = new Date(Math.max(start.getTime(), dayStart.getTime()));
    const effEnd = new Date(Math.min(end.getTime(), dayEnd.getTime()));

    if (effStart >= effEnd) return null;

    const leftPct = ((effStart.getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100;
    const widthPct = ((effEnd.getTime() - effStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeLabel = `${pad(effStart.getHours())}:${pad(effStart.getMinutes())}-${pad(effEnd.getHours())}:${pad(effEnd.getMinutes())}`;

    return { leftPct, widthPct, timeLabel };
  };

  const hours = [];
  for (let h = HOUR_START; h <= HOUR_END; h += 2) {
    hours.push(h);
  }

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2 className="timeline-title">📊 资源占用时间轴</h2>
        <div className="timeline-legend">
          {resourceGroups.map((g) => {
            const c = colorMap.get(g.key)!;
            return (
              <span key={g.key} className="timeline-legend-item">
                <span className="timeline-legend-dot" style={{ backgroundColor: c.bar }}></span>
                <span>{g.resourceType === 'desk' ? '🖥️' : '🏢'} {g.resourceId}</span>
              </span>
            );
          })}
        </div>
      </div>

      {resourceGroups.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-icon">📈</div>
          <div className="empty-text">暂无预订，时间轴空闲</div>
        </div>
      ) : (
        <div className="timeline-wrapper">
          {days.map((day) => {
            const hasBookings = resourceGroups.some((g) =>
              g.bookings.some((b) => {
                const s = new Date(b.startTime);
                const e = new Date(b.endTime);
                return s.toDateString() === day.date.toDateString() || e.toDateString() === day.date.toDateString()
                  || (s < day.date && e > day.date);
              })
            );
            return (
              <div key={day.dateKey} className={`timeline-day ${hasBookings ? '' : 'timeline-day-empty'}`}>
                <div className="timeline-day-header">
                  <span className="timeline-day-label">{day.label}</span>
                </div>
                <div className="timeline-day-content">
                  <div className="timeline-hours">
                    {hours.map((h) => (
                      <span key={h} className="timeline-hour-mark">
                        {h.toString().padStart(2, '0')}:00
                      </span>
                    ))}
                  </div>
                  <div className="timeline-grid">
                    {resourceGroups.map((g) => {
                      const colors = colorMap.get(g.key)!;
                      return (
                        <div key={g.key} className="timeline-row">
                          <div className="timeline-row-label" style={{ backgroundColor: colors.bg, color: colors.text }}>
                            {g.resourceType === 'desk' ? '🖥️' : '🏢'} {g.resourceId}
                          </div>
                          <div className="timeline-row-track">
                            {g.bookings.map((b) => {
                              const pos = getBookingPosition(b, day);
                              if (!pos) return null;
                              return (
                                <div
                                  key={b.id}
                                  className="timeline-bar"
                                  style={{
                                    left: `${pos.leftPct}%`,
                                    width: `${pos.widthPct}%`,
                                    backgroundColor: colors.bar,
                                  }}
                                  title={`${b.userName} · ${pos.timeLabel} · ${b.purpose}`}
                                >
                                  {pos.widthPct > 12 && (
                                    <span className="timeline-bar-text">{b.userName}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

ResourceTimeline.displayName = 'ResourceTimeline';

export default ResourceTimeline;
