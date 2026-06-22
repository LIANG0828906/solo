import { useMemo, useState } from 'react';
import type { Booking, Room, Team } from '../types';
import { generateTimeSlots, parseTime, getTodayString, formatTimeSlot } from '../utils/dateUtils';
import { getColorByTeamId, lightenColor } from '../utils/colorUtils';

interface TimelineProps {
  room: Room;
  bookings: Booking[];
  teams: Team[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSlotClick: (room: Room, startTime: string, endTime: string) => void;
  onBookingClick: (booking: Booking) => void;
}

export default function Timeline({
  room,
  bookings,
  teams,
  selectedDate,
  onDateChange,
  onSlotClick,
  onBookingClick,
}: TimelineProps) {
  const [hoveredBooking, setHoveredBooking] = useState<string | null>(null);
  
  const timeSlots = useMemo(() => generateTimeSlots(8, 22, 30), []);
  const dayBookings = useMemo(
    () => bookings.filter(b => b.roomId === room.id && b.date === selectedDate),
    [bookings, room.id, selectedDate]
  );

  const getSlotWidth = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const duration = end - start;
    const slotDuration = 30;
    return (duration / slotDuration) * 60 - 4;
  };

  const getSlotPosition = (startTime: string) => {
    const dayStart = parseTime('08:00');
    const start = parseTime(startTime);
    const offset = start - dayStart;
    const slotDuration = 30;
    return (offset / slotDuration) * 60;
  };

  const isBooked = (time: string) => {
    return dayBookings.some(booking => {
      const start = parseTime(booking.startTime);
      const end = parseTime(booking.endTime);
      const current = parseTime(time);
      return current >= start && current < end;
    });
  };

  const isPastSlot = (time: string) => {
    if (selectedDate !== getTodayString()) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = parseTime(time);
    return slotMinutes < currentMinutes;
  };

  const isCurrentTime = (time: string) => {
    if (selectedDate !== getTodayString()) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = parseTime(time);
    return currentMinutes >= slotMinutes && currentMinutes < slotMinutes + 30;
  };

  const handleSlotClick = (time: string) => {
    if (isBooked(time) || isPastSlot(time)) return;
    const endMinutes = parseTime(time) + 30;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    onSlotClick(room, time, endTime);
  };

  const dateOptions = useMemo(() => {
    const options: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push(date.toISOString().split('T')[0]);
    }
    return options;
  }, []);

  return (
    <>
      <div className="timeline-container card">
        <div className="timeline-header">
          <h3 className="timeline-title">
            <span>📅</span>
            {room.name} - 时间线
          </h3>
          <div className="date-selector">
            <label>选择日期：</label>
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="date-select"
            >
              {dateOptions.map(date => (
                <option key={date} value={date}>
                  {date === getTodayString() ? '今天 ' : ''}
                  {date}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="timeline-scroll">
          <div className="timeline">
            <div className="time-labels">
              {timeSlots.filter((_, i) => i % 2 === 0).map(time => (
                <div key={time} className="time-label">
                  {time}
                </div>
              ))}
            </div>

            <div className="time-slots">
              {timeSlots.map((time, index) => (
                <div
                  key={time}
                  className={`time-slot 
                    ${isBooked(time) ? 'booked' : ''} 
                    ${isPastSlot(time) ? 'past' : ''}
                    ${isCurrentTime(time) ? 'current' : ''}
                  `}
                  onClick={() => handleSlotClick(time)}
                >
                  {index % 2 === 1 && <div className="slot-divider" />}
                </div>
              ))}

              {dayBookings.map(booking => {
                const team = teams.find(t => t.id === booking.teamId);
                const color = getColorByTeamId(booking.teamId, teams);
                return (
                  <div
                    key={booking.id}
                    className={`booking-block ${hoveredBooking === booking.id ? 'hovered' : ''}`}
                    style={{
                      left: `${getSlotPosition(booking.startTime)}px`,
                      width: `${getSlotWidth(booking.startTime, booking.endTime)}px`,
                      backgroundColor: color,
                    }}
                    onMouseEnter={() => setHoveredBooking(booking.id)}
                    onMouseLeave={() => setHoveredBooking(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick(booking);
                    }}
                  >
                    <div className="booking-content">
                      <div className="booking-team" style={{ color: lightenColor('#ffffff', 0) }}>
                        {team?.name || '未知团队'}
                      </div>
                      <div className="booking-time">
                        {formatTimeSlot(booking.startTime, booking.endTime)}
                      </div>
                    </div>

                    {hoveredBooking === booking.id && (
                      <div className="booking-tooltip">
                        <div className="tooltip-title">{booking.purpose}</div>
                        <div className="tooltip-team">团队：{team?.name}</div>
                        <div className="tooltip-time">
                          {formatTimeSlot(booking.startTime, booking.endTime)}
                        </div>
                        <div className="tooltip-hint">点击查看详情</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="timeline-legend">
          <div className="legend-item">
            <span className="legend-color available" />
            <span>可预订</span>
          </div>
          <div className="legend-item">
            <span className="legend-color past" />
            <span>已过期</span>
          </div>
          <div className="legend-item">
            <span className="legend-color current" />
            <span>当前时间</span>
          </div>
        </div>
      </div>

      <style>{`
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          overflow: hidden;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .timeline-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-lg);
          font-weight: 600;
        }

        .date-selector {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .date-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-button);
          background: white;
          font-size: var(--font-size-sm);
          cursor: pointer;
        }

        .timeline-scroll {
          overflow-x: auto;
          padding-bottom: var(--spacing-sm);
        }

        .timeline {
          min-width: 1200px;
          position: relative;
        }

        .time-labels {
          display: flex;
          padding-left: 60px;
          margin-bottom: var(--spacing-xs);
        }

        .time-label {
          width: 120px;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-align: center;
        }

        .time-slots {
          display: flex;
          position: relative;
          padding-left: 60px;
          height: 60px;
        }

        .time-slot {
          width: 56px;
          height: 100%;
          border: 1px solid var(--color-border-light);
          border-right: none;
          background: #fafafa;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .time-slot:first-child {
          border-left: 1px solid var(--color-border-light);
          border-radius: 4px 0 0 4px;
        }

        .time-slot:last-child {
          border-right: 1px solid var(--color-border-light);
          border-radius: 0 4px 4px 0;
        }

        .time-slot:hover:not(.booked):not(.past) {
          background: rgba(59, 130, 246, 0.1);
          border-color: var(--color-primary);
        }

        .time-slot.booked {
          background: #f0f0f0;
          cursor: default;
        }

        .time-slot.past {
          background: #f5f5f5;
          opacity: 0.6;
          cursor: not-allowed;
        }

        .time-slot.current {
          background: rgba(16, 185, 129, 0.1);
          border-color: var(--color-success);
        }

        .slot-divider {
          position: absolute;
          left: -1px;
          top: 10%;
          height: 80%;
          width: 1px;
          background: var(--color-border-light);
        }

        .booking-block {
          position: absolute;
          top: 4px;
          height: 52px;
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
          z-index: 1;
          overflow: hidden;
        }

        .booking-block:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .booking-block.hovered {
          z-index: 10;
        }

        .booking-content {
          padding: var(--spacing-xs) var(--spacing-sm);
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          overflow: hidden;
        }

        .booking-team {
          font-size: var(--font-size-xs);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .booking-time {
          font-size: 11px;
          opacity: 0.9;
        }

        .booking-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-button);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
          z-index: 100;
          font-size: var(--font-size-xs);
        }

        .booking-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: white;
        }

        .tooltip-title {
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }

        .tooltip-team,
        .tooltip-time {
          color: var(--color-text-secondary);
        }

        .tooltip-hint {
          margin-top: 4px;
          color: var(--color-primary);
          font-weight: 500;
        }

        .timeline-legend {
          display: flex;
          gap: var(--spacing-xl);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border-light);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          border: 1px solid var(--color-border);
        }

        .legend-color.available {
          background: #fafafa;
        }

        .legend-color.past {
          background: #f5f5f5;
          opacity: 0.6;
        }

        .legend-color.current {
          background: rgba(16, 185, 129, 0.2);
          border-color: var(--color-success);
        }

        @media (max-width: 768px) {
          .timeline-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .date-selector {
            width: 100%;
          }

          .date-select {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
}
