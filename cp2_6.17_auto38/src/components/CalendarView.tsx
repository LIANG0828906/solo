import { useState, useMemo, useRef, useEffect } from 'react';
import { usePropertyStore } from '@/store/propertyStore';
import type { Booking, BookingStatus } from '@/types';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

const statusColors: Record<BookingStatus, string> = {
  booked: '#E74C3C',
  available: '#2ECC71',
  pending: '#F39C12',
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [draggingBooking, setDraggingBooking] = useState<Booking | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);

  const bookings = usePropertyStore((s) => s.bookings);
  const selectedPropertyId = usePropertyStore((s) => s.selectedPropertyId);
  const properties = usePropertyStore((s) => s.properties);
  const getBookingsForDate = usePropertyStore((s) => s.getBookingsForDate);
  const updateBooking = usePropertyStore((s) => s.updateBooking);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return days;
  }, [year, month]);

  const getDayStatus = (dateStr: string): BookingStatus => {
    const dayBookings = getBookingsForDate(dateStr);
    if (dayBookings.length === 0) return 'available';
    if (dayBookings.some((b) => b.status === 'pending')) return 'pending';
    if (dayBookings.some((b) => b.status === 'booked')) return 'booked';
    return 'available';
  };

  const getPropertyName = (pid: string) => properties.find((p) => p.id === pid)?.name || '';

  const handleDateClick = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const dayBookings = getBookingsForDate(dateStr);
    if (dayBookings.length === 0) {
      setSelectedDate(null);
      setPopoverPos(null);
      return;
    }
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const calRect = calendarRef.current?.getBoundingClientRect();
    if (calRect) {
      setSelectedDate(dateStr);
      setPopoverPos({
        x: Math.min(rect.left - calRect.left, calRect.width - 220),
        y: rect.bottom - calRect.top + 8,
      });
    }
  };

  const handleDragStart = (booking: Booking, e: React.DragEvent) => {
    setDraggingBooking(booking);
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).style.opacity = '0.6';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggingBooking(null);
    setDragOverDate(null);
  };

  const handleDragOver = (dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(dateStr);
  };

  const handleDrop = (dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    if (draggingBooking) {
      updateBooking(draggingBooking.id, { date: dateStr });
    }
    setDraggingBooking(null);
    setDragOverDate(null);
  };

  const goPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setPopoverPos(null);
    setAnimKey((k) => k + 1);
  };

  const goNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setPopoverPos(null);
    setAnimKey((k) => k + 1);
  };

  useEffect(() => {
    const handleClick = () => {
      setSelectedDate(null);
      setPopoverPos(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const selectedDayBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  return (
    <div className="calendar-view" ref={calendarRef}>
      <div className="calendar-header">
        <button onClick={goPrevMonth} className="cal-nav-btn">‹</button>
        <h3 className="cal-title">{year}年 {month + 1}月</h3>
        <button onClick={goNextMonth} className="cal-nav-btn">›</button>
      </div>

      <div className="calendar-weekdays">
        {WEEK_DAYS.map((w) => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
      </div>

      <div key={animKey} className="calendar-grid calendar-fade-in">
        {calendarDays.map((dateStr, idx) => (
          <div
            key={idx}
            className={`cal-day-cell ${dateStr === todayStr ? 'is-today' : ''} ${dateStr === dragOverDate ? 'drag-over' : ''}`}
            onDragOver={dateStr ? (e) => handleDragOver(dateStr, e) : undefined}
            onDrop={dateStr ? (e) => handleDrop(dateStr, e) : undefined}
            onClick={dateStr ? (e) => handleDateClick(dateStr, e) : undefined}
          >
            {dateStr && (
              <>
                <div className="cal-day-num">{parseInt(dateStr.split('-')[2])}</div>
                <div
                  className="cal-status-block"
                  style={{ backgroundColor: statusColors[getDayStatus(dateStr)] }}
                />
                {getBookingsForDate(dateStr)
                  .slice(0, 2)
                  .map((b) => (
                    <div
                      key={b.id}
                      className={`cal-booking-item ${draggingBooking?.id === b.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(b, e)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      title={`${getPropertyName(b.propertyId)} - ${b.customerName}`}
                    >
                      <span className="cal-booking-dot" style={{ backgroundColor: statusColors[b.status] }} />
                      <span className="cal-booking-name">{b.customerName}</span>
                    </div>
                  ))}
                {getBookingsForDate(dateStr).length > 2 && (
                  <div className="cal-more-count">+{getBookingsForDate(dateStr).length - 2}</div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {selectedDate && popoverPos && selectedDayBookings.length > 0 && (
        <div
          className="cal-popover"
          style={{ left: popoverPos.x, top: popoverPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cal-popover-date">{selectedDate}</div>
          {selectedDayBookings.map((b) => (
            <div key={b.id} className="cal-popover-item">
              <div className="cal-popover-row">
                <span
                  className="cal-popover-status"
                  style={{ backgroundColor: statusColors[b.status] }}
                />
                <span className="cal-popover-name">{b.customerName}</span>
              </div>
              <div className="cal-popover-row cal-popover-sub">
                {selectedPropertyId ? '' : `${getPropertyName(b.propertyId)} · `}
                {b.nights}晚 · ¥{b.totalPrice}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#2ECC71' }} />空闲
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#E74C3C' }} />已预订
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#F39C12' }} />待确认
        </div>
      </div>
    </div>
  );
}
