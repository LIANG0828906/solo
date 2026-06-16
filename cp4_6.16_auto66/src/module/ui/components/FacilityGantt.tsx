import { useState, useEffect, useRef } from 'react';
import {
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isBefore,
  isAfter,
  parseISO,
  differenceInMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import type { Facility, Booking } from '../../facility/types';
import { checkConflict } from '../../facility/facilityService';

interface FacilityGanttProps {
  facility: Facility;
  bookings: Booking[];
  onSlotClick?: (start: Date, end: Date) => void;
  days?: number;
  selectedBookingId?: string;
}

const HOUR_HEIGHT = 50;

export default function FacilityGantt({
  facility,
  bookings,
  onSlotClick,
  days = 14,
  selectedBookingId,
}: FacilityGanttProps) {
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [hoverSlot, setHoverSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const daysToShow = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, days - 1),
  });

  const hours = Array.from(
    { length: facility.closeHour - facility.openHour },
    (_, i) => facility.openHour + i
  );

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));
  const today = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setWeekStart(now);
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return '#48BB78';
      case 'pending':
        return '#ECC94B';
      case 'rejected':
        return '#F56565';
    }
  };

  const getBookingForCell = (day: Date, hour: number) => {
    const cellStart = setHours(setMinutes(day, 0), hour);
    const cellEnd = setHours(setMinutes(day, 0), hour + 1);

    return bookings.filter((b) => {
      if (b.status === 'rejected') return false;
      const bStart = parseISO(b.startTime);
      const bEnd = parseISO(b.endTime);
      return isBefore(cellStart, bEnd) && isAfter(cellEnd, bStart);
    });
  };

  const handleCellClick = (day: Date, hour: number) => {
    if (!onSlotClick) return;
    const start = setHours(setMinutes(day, 0), hour);
    if (start < new Date()) return;
    onSlotClick(start, setHours(start, hour + 1));
  };

  if (isMobile) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={prevWeek}>← 上一周</button>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>
            {format(weekStart, 'MM/dd')} - {format(addDays(weekStart, days - 1), 'MM/dd')}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={nextWeek}>下一周 →</button>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: '12px', width: '100%' }} onClick={today}>回到今天</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {daysToShow.map((day) => {
            const dayBookings = bookings.filter(
              (b) => isSameDay(parseISO(b.startTime), day) && b.status !== 'rejected'
            ).sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());
            return (
              <div key={day.toISOString()} className="card" style={{ padding: '12px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: isSameDay(day, new Date()) ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {format(day, 'MM月dd日 EEEE')}
                </div>
                {dayBookings.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '8px 0' }}>暂无预约</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: getStatusColor(b.status) + '20',
                          borderLeft: `3px solid ${getStatusColor(b.status)}`,
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>
                          {format(parseISO(b.startTime), 'HH:mm')} - {format(parseISO(b.endTime), 'HH:mm')}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {b.userName} · {b.purpose}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', marginRight: '8px' }}>{facility.icon || '📅'}</span>
          <span style={{ fontWeight: 600 }}>{facility.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={prevWeek}>← 上一周</button>
          <button className="btn btn-ghost btn-sm" onClick={today}>今天</button>
          <button className="btn btn-ghost btn-sm" onClick={nextWeek}>下一周 →</button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-warm)' }}>
        <div style={{ width: '60px', flexShrink: 0, padding: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>时间</div>
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
          {daysToShow.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: isToday ? 600 : 400,
                  color: isToday ? 'var(--primary)' : 'var(--text-primary)',
                  background: isToday ? 'var(--primary-light)15' : 'transparent',
                }}
              >
                {format(day, 'MM/dd')}
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {format(day, 'EEE')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={scrollRef} style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px' }}>
        <div style={{ display: 'flex', position: 'relative' }}>
          <div style={{ width: '60px', flexShrink: 0 }}>
            {hours.map((h) => (
              <div
                key={h}
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  padding: '4px 8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flex: 1 }}>
            {daysToShow.map((day) => (
              <div
                key={day.toISOString()}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  position: 'relative',
                  borderRight: '1px solid var(--border)',
                }}
              >
                {hours.map((h) => {
                  const cellBookings = getBookingForCell(day, h);
                  const cellStart = setHours(setMinutes(day, 0), h);
                  const isPast = cellStart < new Date();
                  return (
                    <div
                      key={h}
                      onMouseEnter={() => !isPast && onSlotClick && setHoverSlot({ day, hour: h })}
                      onMouseLeave={() => setHoverSlot(null)}
                      onClick={() => handleCellClick(day, h)}
                      style={{
                        height: `${HOUR_HEIGHT}px`,
                        borderBottom: '1px solid var(--border)',
                        background: hoverSlot?.day.getTime() === day.getTime() && hoverSlot?.hour === h && !isPast
                          ? 'var(--primary-light)20'
                          : isPast
                          ? '#FAFAFA'
                          : 'transparent',
                        cursor: onSlotClick && !isPast ? 'pointer' : 'default',
                        transition: 'background 0.2s',
                        position: 'relative',
                      }}
                    >
                      {cellBookings.map((b) => {
                        if (parseISO(b.startTime).getHours() !== h) return null;
                        const bStart = parseISO(b.startTime);
                        const bEnd = parseISO(b.endTime);
                        const minutesFromHour = bStart.getMinutes();
                        const duration = differenceInMinutes(bEnd, bStart);
                        const top = (minutesFromHour / 60) * HOUR_HEIGHT;
                        const height = (duration / 60) * HOUR_HEIGHT - 4;
                        const isSelected = selectedBookingId === b.id;
                        const conflict = checkConflict(bookings, facility.id, bStart, bEnd, b.id).hasConflict;
                        return (
                          <div
                            key={b.id}
                            className={isSelected ? 'shake' : ''}
                            style={{
                              position: 'absolute',
                              left: '4px',
                              right: '4px',
                              top: `${top + 2}px`,
                              height: `${height}px`,
                              backgroundColor: conflict ? 'var(--danger)' : getStatusColor(b.status) + 'CC',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              color: 'white',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              boxShadow: isSelected ? '0 0 0 2px var(--primary)' : 'none',
                              animation: conflict ? 'blink 1s ease-in-out infinite' : undefined,
                              zIndex: conflict ? 10 : 1,
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>
                              {format(bStart, 'HH:mm')}-{format(bEnd, 'HH:mm')}
                            </div>
                            <div style={{ opacity: 0.9, fontSize: '11px' }}>{b.userName}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#48BB78' }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>已确认</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#ECC94B' }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>待审核</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#F56565' }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>冲突</span>
        </div>
      </div>
    </div>
  );
}
