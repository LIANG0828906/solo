import { useState, useMemo } from 'react';
import { Device, Booking } from '../types';
import {
  getMonthMatrix,
  formatDate,
  isToday,
  getWeekdayName,
} from '../utils/dateUtils';
import '../styles/CalendarView.css';

interface CalendarViewProps {
  currentMonth: Date;
  bookings: Booking[];
  devices: Device[];
  onMonthChange: (direction: number) => void;
  onDateClick: (date: Date) => void;
  isLoading: boolean;
}

function CalendarView({
  currentMonth,
  bookings,
  devices,
  onMonthChange,
  onDateClick,
  isLoading,
}: CalendarViewProps) {
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthMatrix = useMemo(() => getMonthMatrix(year, month), [year, month]);

  const getBookingsForDate = (date: Date): Booking[] => {
    const dateStr = formatDate(date);
    return bookings.filter((b) => b.date === dateStr);
  };

  const getDeviceById = (id: string): Device | undefined => {
    return devices.find((d) => d.id === id);
  };

  const getBookingCountLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 2) return 2;
    if (count <= 4) return 3;
    return 4;
  };

  const handleMonthChange = (direction: number) => {
    if (isAnimating) return;
    setAnimationDirection(direction > 0 ? 'left' : 'right');
    setIsAnimating(true);

    setTimeout(() => {
      onMonthChange(direction);
      setTimeout(() => {
        setAnimationDirection(null);
        setIsAnimating(false);
      }, 50);
    }, 250);
  };

  const formatMonthYear = (date: Date): string => {
    return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
  };

  const weekdayHeaders = Array.from({ length: 7 }, (_, i) => getWeekdayName(i));

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button
          className="month-nav-btn"
          onClick={() => handleMonthChange(-1)}
          disabled={isAnimating}
        >
          ‹
        </button>
        <h2 className="calendar-title">{formatMonthYear(currentMonth)}</h2>
        <button
          className="month-nav-btn"
          onClick={() => handleMonthChange(1)}
          disabled={isAnimating}
        >
          ›
        </button>
      </div>

      <div className="calendar-grid-wrapper">
        <div
          className={`calendar-grid ${
            animationDirection === 'left'
              ? 'slide-left'
              : animationDirection === 'right'
              ? 'slide-right'
              : ''
          }`}
        >
          <div className="calendar-weekdays">
            {weekdayHeaders.map((day, index) => (
              <div
                key={day}
                className={`weekday-header ${index === 0 || index === 6 ? 'weekend' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {monthMatrix.map((week, weekIndex) =>
              week.map((date, dayIndex) => {
                if (!date) {
                  return <div key={`${weekIndex}-${dayIndex}`} className="day-cell empty" />;
                }

                const dayBookings = getBookingsForDate(date);
                const bookingLevel = getBookingCountLevel(dayBookings.length);
                const isTodayDate = isToday(date);
                const isWeekend = dayIndex === 0 || dayIndex === 6;

                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`day-cell ${isTodayDate ? 'today' : ''} ${
                      isWeekend ? 'weekend' : ''
                    } ${isLoading ? 'loading' : ''}`}
                    onClick={() => onDateClick(date)}
                  >
                    <span className="day-number">{date.getDate()}</span>

                    {dayBookings.length > 0 && (
                      <div className="day-bookings">
                        <div className="booking-icons">
                          {dayBookings.slice(0, 3).map((booking) => {
                            const device = getDeviceById(booking.deviceId);
                            return (
                              <span key={booking.id} className="booking-icon" title={device?.name}>
                                {device?.icon}
                              </span>
                            );
                          })}
                          {dayBookings.length > 3 && (
                            <span className="booking-more">+{dayBookings.length - 3}</span>
                          )}
                        </div>
                        <div className={`booking-bar level-${bookingLevel}`} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="calendar-legend">
        <span className="legend-title">预约量：</span>
        {[1, 2, 3, 4].map((level) => (
          <div key={level} className="legend-item">
            <div className={`legend-bar level-${level}`} />
            <span>{level === 1 ? '少' : level === 2 ? '中' : level === 3 ? '多' : '繁忙'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarView;
