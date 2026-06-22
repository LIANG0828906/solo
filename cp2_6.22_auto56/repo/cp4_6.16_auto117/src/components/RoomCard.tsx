import { useMemo } from 'react';
import type { Room, Booking, Team } from '../types';
import { getColorByTeamId, getStatusColor, getStatusBgColor } from '../utils/colorUtils';
import { isTimeSlotActive, getRemainingMinutes, formatMinutes, getCurrentTimeSlot } from '../utils/dateUtils';

interface RoomCardProps {
  room: Room;
  bookings: Booking[];
  teams: Team[];
  onBook: (room: Room) => void;
  onViewBookings: (room: Room) => void;
}

const facilityIcons: Record<string, string> = {
  '投影仪': '📽️',
  '白板': '📋',
  '视频会议系统': '📹',
  '视频会议': '📹',
  '电视': '📺',
  '音响系统': '🔊',
  '专业音响': '🔊',
  '电子白板': '✏️',
  '茶水服务': '🍵',
  '灯光系统': '💡',
  '可移动桌椅': '🪑',
};

export default function RoomCard({ room, bookings, teams, onBook, onViewBookings }: RoomCardProps) {
  const currentStatus = useMemo(() => {
    if (room.status === 'maintenance') return { status: 'maintenance', teamName: '', remaining: 0 };
    
    const now = getCurrentTimeSlot();
    const activeBooking = bookings.find(b => 
      isTimeSlotActive(b.startTime, b.endTime) && b.date === new Date().toISOString().split('T')[0]
    );
    
    if (activeBooking) {
      const team = teams.find(t => t.id === activeBooking.teamId);
      const remaining = getRemainingMinutes(activeBooking.endTime);
      return { status: 'occupied' as const, teamName: team?.name || '', remaining };
    }
    
    return { status: 'available' as const, teamName: '', remaining: 0 };
  }, [room, bookings, teams]);

  const statusText = {
    available: '空闲',
    occupied: '使用中',
    maintenance: '维护中',
  };

  return (
    <>
      <div className="room-card card">
        <div className="room-image-container">
          <img src={room.imageUrl} alt={room.name} className="room-image" />
          <div
            className="status-badge"
            style={{
              backgroundColor: getStatusBgColor(currentStatus.status),
              color: getStatusColor(currentStatus.status),
            }}
          >
            <span className="status-dot" style={{ backgroundColor: getStatusColor(currentStatus.status) }} />
            {statusText[currentStatus.status]}
          </div>
        </div>

        <div className="room-info">
          <div className="room-header">
            <h3 className="room-name">{room.name}</h3>
            <span className="room-floor">{room.floor}层</span>
          </div>

          <div className="room-meta">
            <span className="capacity">
              <span className="meta-icon">👥</span>
              {room.capacity}人
            </span>
            {currentStatus.status === 'occupied' && currentStatus.teamName && (
              <span className="booking-team">
                <span
                  className="team-color-dot"
                  style={{ backgroundColor: getColorByTeamId(bookings[0]?.teamId || '', teams) }}
                />
                {currentStatus.teamName}
                {currentStatus.remaining > 0 && (
                  <span className="remaining-time">
                    剩余 {formatMinutes(currentStatus.remaining)}
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="facilities">
            {room.facilities.slice(0, 4).map((facility, idx) => (
              <span key={idx} className="facility-tag" title={facility}>
                {facilityIcons[facility] || '📌'}
              </span>
            ))}
            {room.facilities.length > 4 && (
              <span className="facility-more">+{room.facilities.length - 4}</span>
            )}
          </div>

          <div className="room-actions">
            <button
              className="btn btn-ghost"
              onClick={() => onViewBookings(room)}
              disabled={room.status === 'maintenance'}
            >
              查看日程
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onBook(room)}
              disabled={room.status === 'maintenance'}
            >
              立即预订
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .room-card {
          overflow: hidden;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .room-image-container {
          position: relative;
          height: 160px;
          overflow: hidden;
        }

        .room-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .room-card:hover .room-image {
          transform: scale(1.05);
        }

        .status-badge {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: var(--font-size-xs);
          font-weight: 500;
          backdrop-filter: blur(8px);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .room-info {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          flex: 1;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .room-name {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .room-floor {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          background: var(--color-bg-primary);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .room-meta {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .capacity {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .meta-icon {
          font-size: var(--font-size-base);
        }

        .booking-team {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          flex-wrap: wrap;
        }

        .team-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .remaining-time {
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
        }

        .facilities {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .facility-tag {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-primary);
          border-radius: var(--radius-button);
          font-size: var(--font-size-base);
          transition: all var(--transition-fast);
        }

        .facility-tag:hover {
          background: #e5e7eb;
          transform: scale(1.1);
        }

        .facility-more {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-primary);
          border-radius: var(--radius-button);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .room-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: auto;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border-light);
        }

        .room-actions .btn {
          flex: 1;
        }

        .room-actions .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .room-image-container {
            height: 140px;
          }
        }
      `}</style>
    </>
  );
}
