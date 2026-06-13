import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { useApp } from '../App';
import { Booking, BookingStatus, Teacher, Course } from '../types';

type ViewMode = 'month' | 'list';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const STATUS_DOT_COLOR: Record<BookingStatus, string> = {
  pending: '#F59E0B',
  confirmed: '#10B981',
  completed: '#3B82F6',
  cancelled: '#9CA3AF',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

function getCourseType(booking: Booking, teachers: Teacher[]): string {
  for (const t of teachers) {
    for (const c of t.courses) {
      if (c.id === booking.courseId) return c.type;
    }
  }
  return '';
}

function getTeacherName(booking: Booking, teachers: Teacher[]): string {
  const teacher = teachers.find(t => t.id === booking.teacherId);
  return teacher?.name ?? '';
}

export default function CalendarView() {
  const { bookings, teachers, currentUser, setSelectedBooking } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [animKey, setAnimKey] = useState(0);
  const [visibleWeekRange, setVisibleWeekRange] = useState<[number, number]>([0, 5]);
  const gridRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const totalWeeks = Math.ceil(allDays.length / 7);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const existing = map.get(b.date) ?? [];
      existing.push(b);
      map.set(b.date, existing);
    }
    return map;
  }, [bookings]);

  const sortedBookings = useMemo(() => {
    return [...bookings]
      .filter(b => b.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [bookings]);

  const switchView = useCallback((mode: ViewMode) => {
    if (mode !== viewMode) {
      setViewMode(mode);
      setAnimKey(k => k + 1);
    }
  }, [viewMode]);

  const handlePrevMonth = () => setCurrentMonth(m => subMonths(m, 1));
  const handleNextMonth = () => setCurrentMonth(m => addMonths(m, 1));
  const handleToday = () => setCurrentMonth(new Date());

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const handleScroll = () => {
      const scrollTop = grid.scrollTop;
      const rowHeight = grid.scrollHeight / totalWeeks;
      const startWeek = Math.floor(scrollTop / rowHeight);
      const endWeek = Math.min(startWeek + 5, totalWeeks - 1);
      setVisibleWeekRange([startWeek, endWeek]);
    };

    grid.addEventListener('scroll', handleScroll, { passive: true });
    return () => grid.removeEventListener('scroll', handleScroll);
  }, [totalWeeks]);

  useEffect(() => {
    setVisibleWeekRange([0, 5]);
  }, [currentMonth]);

  const visibleDays = useMemo(() => {
    const start = visibleWeekRange[0] * 7;
    const end = (visibleWeekRange[1] + 1) * 7;
    const bufferBefore = 7;
    const bufferAfter = 7;
    const from = Math.max(0, start - bufferBefore);
    const to = Math.min(allDays.length, end + bufferAfter);
    return allDays.slice(from, to);
  }, [allDays, visibleWeekRange]);

  const renderDayCell = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayBookings = bookingsByDate.get(dateStr) ?? [];
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isToday = isSameDay(day, new Date());

    return (
      <div
        key={dateStr}
        className="calendar-day-cell"
        onClick={() => {
          const first = dayBookings[0];
          if (first) setSelectedBooking(first);
        }}
        style={{
          minHeight: 80,
          padding: 4,
          background: isToday ? '#FEF3C7' : isCurrentMonth ? '#FFFFFF' : '#F9FAFB',
          borderRight: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
          cursor: dayBookings.length > 0 ? 'pointer' : 'default',
          opacity: isCurrentMonth ? 1 : 0.45,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: isToday ? 700 : 500,
            color: isToday ? '#F59E0B' : '#1F2937',
            marginBottom: 2,
          }}
        >
          {format(day, 'd')}
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {dayBookings.slice(0, 3).map(b => (
            <span
              key={b.id}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: STATUS_DOT_COLOR[b.status],
                display: 'inline-block',
              }}
            />
          ))}
          {dayBookings.length > 3 && (
            <span style={{ fontSize: 10, color: '#6B7280' }}>+{dayBookings.length - 3}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          📅 课程日历
        </h2>
        <div className="tabs" style={{ width: 'auto' }}>
          <button className={`tab ${viewMode === 'month' ? 'active' : ''}`} onClick={() => switchView('month')}>
            月视图
          </button>
          <button className={`tab ${viewMode === 'list' ? 'active' : ''}`} onClick={() => switchView('list')}>
            列表视图
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth}>
          ◀
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, minWidth: 120, textAlign: 'center' }}>
          {format(currentMonth, 'yyyy年M月')}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={handleNextMonth}>
          ▶
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleToday}>
          今天
        </button>
      </div>

      <div key={animKey} className="fade-in">
        {viewMode === 'month' ? (
          <div
            ref={gridRef}
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
              maxHeight: 520,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: '#FEF3C7',
              }}
            >
              {WEEKDAYS.map(d => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    padding: '8px 0',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#92400E',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
              }}
            >
              {totalWeeks <= 6
                ? allDays.map(renderDayCell)
                : visibleDays.map(renderDayCell)}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedBookings.length === 0 && (
              <div className="empty-state">
                <p>暂无课程预约</p>
              </div>
            )}
            {sortedBookings.map(b => (
              <div
                key={b.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 18px',
                }}
                onClick={() => setSelectedBooking(b)}
              >
                <div style={{ minWidth: 64, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', lineHeight: 1.1 }}>
                    {format(parseISO(b.date), 'd')}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                    {format(parseISO(b.date), 'M月')}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1F2937' }}>
                    {b.startTime} - {b.endTime}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {getCourseType(b, teachers)} · {getTeacherName(b, teachers)}
                  </div>
                </div>
                <span className={`badge badge-${b.status}`}>
                  {STATUS_LABEL[b.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
