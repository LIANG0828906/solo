import React, { memo, useCallback } from 'react';
import type { Seat } from '../types';
import { Zap, Wind, UserRound } from 'lucide-react';

interface SeatCellProps {
  seat: Seat;
  isSelected: boolean;
  isFiltered: boolean;
  onClick: (seatId: string) => void;
}

const statusColors: Record<string, string> = {
  available: '#4ECDC4',
  occupied: '#636E72',
  maintenance: '#FF6B6B',
};

const SeatCellComponent: React.FC<SeatCellProps> = ({ seat, isSelected, isFiltered, onClick }) => {
  const handleClick = useCallback(() => {
    if (seat.status !== 'available') return;
    onClick(seat.id);
  }, [seat.id, seat.status, onClick]);

  const bgColor = statusColors[seat.status];
  const isClickable = seat.status === 'available';

  const cursorStyle = isClickable ? 'pointer' : 'not-allowed';
  const opacityStyle = isFiltered ? 1 : 0.15;

  return (
    <div
      className="seat-cell"
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      aria-label={`座位 ${seat.seatNumber} ${seat.status}`}
      title={`${seat.seatNumber} · ${seat.status === 'available' ? '空闲' : seat.status === 'occupied' ? '已占用' : '维修中'}`}
      style={{
        width: 50,
        height: 50,
        borderRadius: 6,
        backgroundColor: bgColor,
        cursor: cursorStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        opacity: opacityStyle,
        border: isSelected ? '2px solid #4ECDC4' : '2px solid transparent',
        boxShadow: isSelected ? '0 0 0 2px rgba(78, 205, 196, 0.3)' : 'none',
        color: '#1A1A2E',
        fontSize: 11,
        fontWeight: 600,
        userSelect: 'none',
      }}
    >
      <span style={{ lineHeight: 1 }}>{seat.seatNumber.slice(2)}</span>

      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          display: 'flex',
          gap: 1,
          pointerEvents: 'none',
        }}
      >
        {seat.tags.windowView && <Wind size={8} color="#1A1A2E" style={{ opacity: 0.7 }} />}
        {seat.tags.powerOutlet && <Zap size={8} color="#1A1A2E" style={{ opacity: 0.7 }} />}
      </div>

      {seat.status === 'maintenance' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <UserRound size={14} color="#fff" />
        </div>
      )}
    </div>
  );
};

export const SeatCell = memo(SeatCellComponent, (prev, next) => {
  return (
    prev.seat.status === next.seat.status &&
    prev.isSelected === next.isSelected &&
    prev.isFiltered === next.isFiltered &&
    prev.onClick === next.onClick
  );
});
