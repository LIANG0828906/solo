import { useState, useEffect, useMemo } from 'react';
import type { Seat, Reservation } from '../types';
import { useAppStore } from '../store';

interface SeatMapProps {
  onStartTimer: (reservationId: string) => void;
  onOpenCancelConfirm: (reservationId: string, seatNumber: number) => void;
}

const SeatMap = ({ onStartTimer, onOpenCancelConfirm }: SeatMapProps) => {
  const { seats, reservations, addReservation } = useAppStore();
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const reservationMap = useMemo(() => {
    const map = new Map<string, Reservation>();
    reservations.forEach(r => {
      if (r.status === 'waiting' || r.status === 'in-progress') {
        map.set(r.seatId, r);
      }
    });
    return map;
  }, [reservations]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'idle') {
      setSelectedSeat(seat);
      setSelectedDuration(1);
    } else if (seat.status === 'in-use') {
      const reservation = reservationMap.get(seat.id);
      if (reservation && reservation.status === 'in-progress') {
        const timer = useAppStore.getState().timer;
        if (!timer.isRunning) {
          onStartTimer(reservation.id);
        }
      }
    } else if (seat.status === 'reserved') {
      const reservation = reservationMap.get(seat.id);
      if (reservation && reservation.status === 'waiting') {
        onOpenCancelConfirm(reservation.id, reservation.seatNumber);
      }
    }
  };

  const handleReserve = async () => {
    if (!selectedSeat) return;
    setIsSubmitting(true);
    try {
      const reservation = await addReservation(selectedSeat.id, selectedDuration);
      setSelectedSeat(null);
      onStartTimer(reservation.id);
    } catch (e) {
      console.error('预约失败', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (!isSubmitting) setSelectedSeat(null);
  };

  const renderProgressRing = (reservation: Reservation) => {
    const now = Date.now();
    const elapsed = now - reservation.createdAt;
    const total = reservation.startTime - reservation.createdAt;
    const progress = total > 0 ? Math.min(1, elapsed / total) : 1;
    const radius = 7;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);

    return (
      <div className="seat-progress-ring">
        <svg viewBox="0 0 18 18">
          <circle className="bg" cx="9" cy="9" r={radius} />
          <circle
            className="fg"
            cx="9"
            cy="9"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="seatmap-container">
      <div>
        <h2 className="page-title">楼层座位地图</h2>
        <p className="page-subtitle">点击空闲座位进行预约，点击使用中座位开始专注计时</p>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color legend-idle" />
          <span>空闲可预约</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-reserved" />
          <span>已预约</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-inuse" />
          <span>使用中</span>
        </div>
      </div>

      <div className="seat-grid">
        {seats.map(seat => {
          const reservation = reservationMap.get(seat.id);
          const statusClass = seat.status === 'idle'
            ? 'seat-idle'
            : seat.status === 'reserved'
              ? 'seat-reserved'
              : 'seat-inuse';
          return (
            <div
              key={seat.id}
              className={`seat ${statusClass}`}
              onClick={() => handleSeatClick(seat)}
            >
              {seat.number}
              {seat.status === 'reserved' && (
                <>
                  {reservation && renderProgressRing(reservation)}
                  <span className="seat-icon">⏰</span>
                </>
              )}
              {seat.status === 'in-use' && (
                <span className="seat-icon">●</span>
              )}
            </div>
          );
        })}
      </div>

      {selectedSeat && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">预约座位 #{selectedSeat.number}</h3>
            <p className="modal-subtitle">选择您需要的学习时长</p>

            <div className="form-group">
              <label className="form-label">学习时长</label>
              <select
                className="form-select"
                value={selectedDuration}
                onChange={e => setSelectedDuration(parseFloat(e.target.value))}
                disabled={isSubmitting}
              >
                <option value={0.5}>0.5 小时 (30分钟)</option>
                <option value={1}>1 小时 (60分钟)</option>
                <option value={2}>2 小时 (120分钟)</option>
                <option value={3}>3 小时 (180分钟)</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleReserve}
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '确认预约'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMap;
