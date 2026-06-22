import React from 'react';

interface Seat {
  id: string;
  seat_number: string;
  floor: number;
  status: string;
  current_user_id?: string;
  occupied_at?: string;
}

interface SeatCardProps {
  seat: Seat;
  onClick: (seat: Seat) => void;
}

const SeatCard: React.FC<SeatCardProps> = ({ seat, onClick }) => {
  const getStatusColor = () => {
    switch (seat.status) {
      case 'occupied':
        return '#E74C3C';
      case 'reserved':
        return '#F1C40F';
      default:
        return '#27AE60';
    }
  };

  const isClickable = seat.status !== 'occupied';

  return (
    <div
      onClick={() => isClickable && onClick(seat)}
      style={{
        ...styles.seat,
        backgroundColor: getStatusColor(),
        cursor: isClickable ? 'pointer' : 'not-allowed',
        opacity: isClickable ? 1 : 0.9,
      }}
      className="seat-card"
    >
      <span style={styles.seatNumber}>{seat.seat_number}</span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  seat: {
    aspectRatio: '1',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    minHeight: '50px',
  },
  seatNumber: {
    color: 'white',
    fontSize: '11px',
    fontWeight: 500,
    textAlign: 'center',
    padding: '2px',
    wordBreak: 'break-all',
  },
};

export default SeatCard;
