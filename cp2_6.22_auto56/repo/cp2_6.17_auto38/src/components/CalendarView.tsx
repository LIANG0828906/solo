import { useState, useMemo, useRef, useEffect } from 'react';
import { usePropertyStore } from '@/store/propertyStore';
import type { Booking, BookingStatus } from '@/types';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

const statusColors: Record<BookingStatus, string> = {
  booked: '#E74C3C',
  available: '#2ECC71',
  pending: '#F39C12',
};

const statusLabels: Record<BookingStatus, string> = {
  booked: '已预订',
  available: '空闲',
  pending: '待确认',
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [draggingBooking, setDraggingBooking] = useState<Booking | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<BookingStatus | null>(null);
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
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
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
    e.dataTransfer.setData('text/plain', booking.id);
  };

  const handleDragEnd = () => {
    setDraggingBooking(null);
    setDragOverDate(null);
    setDragOverStatus(null);
  };

  const handleDragOverDate = (dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
    setDragOverStatus(null);
  };

  const handleDragOverStatus = (status: BookingStatus, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
    setDragOverDate(null);
  };

  const handleDropDate = (dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    if (draggingBooking) {
      updateBooking(draggingBooking.id, { date: dateStr });
    }
    handleDragEnd();
  };

  const handleDropStatus = (status: BookingStatus, e: React.DragEvent) => {
    e.preventDefault();
    if (draggingBooking) {
      updateBooking(draggingBooking.id, { status });
    }
    handleDragEnd();
  };

  const handleBookingStatusClick = (booking: Booking, newStatus: BookingStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    updateBooking(booking.id, { status: newStatus });
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

  const statusList: BookingStatus[] = ['available', 'booked', 'pending'];

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
            onDragOver={dateStr ? (e) => handleDragOverDate(dateStr, e) : undefined}
            onDragLeave={() => dateStr === dragOverDate && setDragOverDate(null)}
            onDrop={dateStr ? (e) => handleDropDate(dateStr, e) : undefined}
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
                      className={`cal-booking-item ${draggingBooking?.id === b.id ? 'is-dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(b, e)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      title={`${getPropertyName(b.propertyId)} - ${b.customerName} (${statusLabels[b.status]})`}
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
              <div className="cal-popover-status-switch">
                <span className="cal-popover-status-label">切换状态：</span>
                {statusList.map((s) => (
                  <span
                    key={s}
                    className={`cal-status-chip ${b.status === s ? 'active' : ''}`}
                    style={{ backgroundColor: statusColors[s] }}
                    onClick={(e) => handleBookingStatusClick(b, s, e)}
                    title={statusLabels[s]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="calendar-legend">
        <div
          className={`legend-item ${dragOverStatus === 'available' ? 'drag-over-status' : ''}`}
          onDragOver={(e) => handleDragOverStatus('available', e)}
          onDragLeave={() => dragOverStatus === 'available' && setDragOverStatus(null)}
          onDrop={(e) => handleDropStatus('available', e)}
        >
          <span className="legend-dot" style={{ background: '#2ECC71' }} />空闲
        </div>
        <div
          className={`legend-item ${dragOverStatus === 'booked' ? 'drag-over-status' : ''}`}
          onDragOver={(e) => handleDragOverStatus('booked', e)}
          onDragLeave={() => dragOverStatus === 'booked' && setDragOverStatus(null)}
          onDrop={(e) => handleDropStatus('booked', e)}
        >
          <span className="legend-dot" style={{ background: '#E74C3C' }} />已预订
        </div>
        <div
          className={`legend-item ${dragOverStatus === 'pending' ? 'drag-over-status' : ''}`}
          onDragOver={(e) => handleDragOverStatus('pending', e)}
          onDragLeave={() => dragOverStatus === 'pending' && setDragOverStatus(null)}
          onDrop={(e) => handleDropStatus('pending', e)}
        >
          <span className="legend-dot" style={{ background: '#F39C12' }} />待确认
        </div>
        <span className="legend-hint">（拖拽预订到此切换状态）</span>
      </div>
    </div>
  );
}
