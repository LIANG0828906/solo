// 资源网格组件 - 周视图展示每个资源各时段占用情况
// 数据流向：依赖 AppContext 读取资源与预约数据，触发预约 action
// 被调用方：src/pages/Dashboard.tsx
// 调用方：src/context/AppContext.tsx

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Reservation, Resource } from '@/types';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  setHours,
  setMinutes,
  addHours,
  differenceInMinutes,
  format,
} from 'date-fns';

interface ResourceGridProps {
  onSlotClick?: (resource: Resource, date: Date, hour: number) => void;
  onReservationClick?: (reservation: Reservation) => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);
const HOUR_HEIGHT = 60;

export default function ResourceGrid({ onSlotClick, onReservationClick }: ResourceGridProps) {
  const { state, filteredResources, isDateBlocked } = useApp();
  const [hoveredReservation, setHoveredReservation] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ resourceId: string; hour: number; dayIndex: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);

  const weekDays = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).slice(0, 7);
  }, []);

  const getResourceReservations = (resourceId: string, day: Date) => {
    return state.reservations.filter(
      (r) => r.resourceId === resourceId && isSameDay(new Date(r.startTime), day)
    );
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleSlotClick = (resource: Resource, day: Date, hour: number) => {
    if (isDateBlocked(day)) return;
    onSlotClick?.(resource, day, hour);
  };

  const handleReservationHover = (e: React.MouseEvent, reservation: Reservation) => {
    setHoveredReservation(reservation.id);
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      content: (
        <div className="tooltip-content">
          <div className="tooltip-title">{reservation.userName}</div>
          <div className="tooltip-time">
            {format(new Date(reservation.startTime), 'HH:mm')} - {format(new Date(reservation.endTime), 'HH:mm')}
          </div>
          {reservation.note && <div className="tooltip-note">备注: {reservation.note}</div>}
        </div>
      ),
    });
  };

  const handleMouseLeave = () => {
    setHoveredReservation(null);
    setHoveredSlot(null);
    setTooltip(null);
  };

  return (
    <div className="resource-grid-container" onMouseLeave={handleMouseLeave}>
      <div className="resource-grid">
        <div className="grid-header">
          <div className="time-column"></div>
          {weekDays.map((day, idx) => (
            <div key={idx} className={`day-header ${isDateBlocked(day) ? 'blocked' : ''}`}>
              <div className="day-name">{format(day, 'EEE', { locale: undefined })}</div>
              <div className="day-date">{format(day, 'M/d')}</div>
              {isDateBlocked(day) && <div className="day-blocked-label">节假日</div>}
            </div>
          ))}
        </div>

        <div className="grid-body">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="resource-row">
              <div className="resource-label">
                <div className="resource-color-dot" style={{ backgroundColor: resource.color }}></div>
                <span className="resource-name">{resource.name}</span>
              </div>

              <div className="resource-slots">
                {weekDays.map((day, dayIdx) => {
                  const dayBlocked = isDateBlocked(day);
                  const dayReservations = getResourceReservations(resource.id, day);

                  return (
                    <div key={dayIdx} className={`day-column ${dayBlocked ? 'blocked' : ''}`}>
                      {HOURS.map((hour) => {
                        const slotKey = `${resource.id}-${dayIdx}-${hour}`;
                        const isHovered = hoveredSlot?.resourceId === resource.id &&
                          hoveredSlot?.dayIndex === dayIdx &&
                          hoveredSlot?.hour === hour;

                        return (
                          <div
                            key={hour}
                            className={`time-slot ${dayBlocked ? 'blocked' : ''}`}
                            style={{ height: HOUR_HEIGHT }}
                            onMouseEnter={() => !dayBlocked && setHoveredSlot({ resourceId: resource.id, hour, dayIndex: dayIdx })}
                            onClick={() => handleSlotClick(resource, day, hour)}
                          >
                            {isHovered && (
                              <button className="book-btn" onClick={(e) => {
                                e.stopPropagation();
                                handleSlotClick(resource, day, hour);
                              }}>
                                预约
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {dayReservations.map((reservation) => {
                        const startHour = new Date(reservation.startTime).getHours() +
                          new Date(reservation.startTime).getMinutes() / 60;
                        const endHour = new Date(reservation.endTime).getHours() +
                          new Date(reservation.endTime).getMinutes() / 60;
                        const top = (startHour - 8) * HOUR_HEIGHT;
                        const height = (endHour - startHour) * HOUR_HEIGHT;

                        return (
                          <div
                            key={reservation.id}
                            className={`reservation-block ${hoveredReservation === reservation.id ? 'hovered' : ''}`}
                            style={{
                              top,
                              height,
                              backgroundColor: resource.color,
                              animation: 'fadeIn 0.3s ease-out',
                            }}
                            onMouseEnter={(e) => handleReservationHover(e, reservation)}
                            onClick={() => onReservationClick?.(reservation)}
                          >
                            <span className="reservation-initials">{getInitials(reservation.userName)}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="time-labels">
          <div className="time-column"></div>
          {HOURS.map((hour) => (
            <div key={hour} className="time-label" style={{ height: HOUR_HEIGHT, top: hour * 0 + 40 }}>
              {hour}:00
            </div>
          ))}
        </div>
      </div>

      {tooltip && (
        <div
          className="calendar-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            zIndex: 1000,
          }}
        >
          {tooltip.content}
        </div>
      )}

      <style>{`
        .resource-grid-container {
          position: relative;
          overflow-x: auto;
          background: #fff;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.06);
        }

        .resource-grid {
          min-width: 800px;
        }

        .grid-header {
          display: flex;
          border-bottom: 1px solid #E0E0E0;
          background: #fafafa;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .time-column {
          width: 140px;
          min-width: 140px;
          flex-shrink: 0;
          border-right: 1px solid #E0E0E0;
        }

        .day-header {
          flex: 1;
          padding: 12px 8px;
          text-align: center;
          border-right: 1px solid #E0E0E0;
          font-size: 13px;
          color: #333;
        }

        .day-header:last-child {
          border-right: none;
        }

        .day-header.blocked {
          background: repeating-linear-gradient(
            45deg,
            #f5f5f5,
            #f5f5f5 5px,
            #e0e0e0 5px,
            #e0e0e0 10px
          );
        }

        .day-name {
          font-weight: 600;
          font-size: 12px;
          color: #666;
        }

        .day-date {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-top: 2px;
        }

        .day-blocked-label {
          font-size: 10px;
          color: #999;
          margin-top: 2px;
        }

        .grid-body {
          position: relative;
        }

        .resource-row {
          display: flex;
          border-bottom: 1px solid #E0E0E0;
        }

        .resource-row:last-child {
          border-bottom: none;
        }

        .resource-label {
          width: 140px;
          min-width: 140px;
          flex-shrink: 0;
          padding: 10px 12px;
          border-right: 1px solid #E0E0E0;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fafafa;
          font-size: 13px;
          font-weight: 500;
        }

        .resource-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .resource-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .resource-slots {
          flex: 1;
          display: flex;
          position: relative;
        }

        .day-column {
          flex: 1;
          position: relative;
          border-right: 1px solid #eee;
        }

        .day-column:last-child {
          border-right: none;
        }

        .day-column.blocked {
          background: repeating-linear-gradient(
            45deg,
            #f5f5f5,
            #f5f5f5 5px,
            #e8e8e8 5px,
            #e8e8e8 10px
          );
        }

        .time-slot {
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: background-color 0.15s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .time-slot:hover:not(.blocked) {
          background-color: rgba(30, 136, 229, 0.05);
        }

        .time-slot.blocked {
          cursor: not-allowed;
        }

        .book-btn {
          background: #1E88E5;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: transform 0.15s ease;
          animation: fadeIn 0.2s ease;
        }

        .book-btn:hover {
          transform: scale(1.05);
        }

        .book-btn:active {
          transform: scale(0.95);
        }

        .reservation-block {
          position: absolute;
          left: 4px;
          right: 4px;
          border-radius: 4px;
          padding: 4px 6px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          z-index: 2;
        }

        .reservation-block:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .reservation-initials {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calendar-tooltip {
          background: #2d3748;
          color: white;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          animation: fadeIn 0.15s ease;
          pointer-events: none;
        }

        .tooltip-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .tooltip-time {
          color: #a0aec0;
          margin-bottom: 4px;
        }

        .tooltip-note {
          color: #e2e8f0;
          font-style: italic;
        }

        .time-labels {
          display: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .day-header:nth-child(n+4) {
            display: none;
          }
          .day-column:nth-child(n+4) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
