import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SeatCard from '../components/SeatCard';

interface Seat {
  id: string;
  seat_number: string;
  floor: number;
  status: string;
  current_user_id?: string;
  occupied_at?: string;
}

interface Reservation {
  id: string;
  user_id: string;
  seat_id: string;
  seat_number: string;
  floor: number;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const SeatMap: React.FC = () => {
  const { token, user } = useAuth();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [floor, setFloor] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [duration, setDuration] = useState(1);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showReminder, setShowReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reserveDate, setReserveDate] = useState('');
  const [reserveHour, setReserveHour] = useState('');
  const notifiedReservations = useRef<Set<string>>(new Set());

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const fetchSeats = useCallback(async () => {
    try {
      const response = await fetch(`/api/seats?floor=${floor}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSeats(data.seats || []);
        setReservations(data.userReservations || []);

        const now = new Date();
        for (const reservation of data.userReservations || []) {
          const startTime = new Date(reservation.start_time);
          const diffMinutes = (startTime.getTime() - now.getTime()) / 60000;

          if (diffMinutes > 0 && diffMinutes <= 15 && !notifiedReservations.current.has(reservation.id)) {
            notifiedReservations.current.add(reservation.id);
            setShowReminder(true);
          }

          if (diffMinutes < -15 && reservation.status === 'pending') {
            if (!notifiedReservations.current.has(`cancelled-${reservation.id}`)) {
              notifiedReservations.current.add(`cancelled-${reservation.id}`);
              addNotification(`预约 ${reservation.seat_number} 已超时取消`, 'warning');
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch seats:', error);
    } finally {
      setLoading(false);
    }
  }, [floor, token, addNotification]);

  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 5000);
    return () => clearInterval(interval);
  }, [fetchSeats]);

  useEffect(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    setReserveDate(now.toISOString().split('T')[0]);
    setReserveHour(String(nextHour.getHours()).padStart(2, '0'));
  }, []);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return;
    setSelectedSeat(seat);
    setShowModal(true);
  };

  const handleReserve = async () => {
    if (!selectedSeat || !token) return;

    try {
      const startDateTime = new Date(`${reserveDate}T${reserveHour}:00:00`);

      const response = await fetch('/api/seats/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seatId: selectedSeat.id,
          startTime: startDateTime.toISOString(),
          duration,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        addNotification('预约成功！', 'success');
        setShowModal(false);
        fetchSeats();
      } else {
        addNotification(data.error || '预约失败', 'error');
      }
    } catch (error) {
      addNotification('预约失败，请重试', 'error');
    }
  };

  const floorSeats = seats.filter((s) => s.floor === floor);
  const rows = 6;
  const cols = 8;

  const gridSeats: (Seat | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: (Seat | null)[] = [];
    for (let c = 0; c < cols; c++) {
      const seat = floorSeats[r * cols + c] || null;
      row.push(seat);
    }
    gridSeats.push(row);
  }

  const userReservations = reservations.filter(
    (r) => r.status === 'pending' || r.status === 'active'
  );

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.page}>
      {notifications.map((n) => (
        <div
          key={n.id}
          className="notification"
          style={{
            ...styles.notification,
            borderLeft: `4px solid ${
              n.type === 'success'
                ? '#27AE60'
                : n.type === 'warning'
                ? '#F1C40F'
                : n.type === 'error'
                ? '#E74C3C'
                : '#3498DB'
            }`,
          }}
        >
          {n.message}
        </div>
      ))}

      {showReminder && (
        <div style={styles.reminderBanner}>
          <span>⏰ 您有预约即将开始，请尽快前往座位！</span>
          <button onClick={() => setShowReminder(false)} style={styles.reminderClose}>
            ✕
          </button>
        </div>
      )}

      {userReservations.length > 0 && (
        <div style={styles.reservationBar}>
          <div style={styles.reservationTitle}>我的预约</div>
          <div style={styles.reservationScroll}>
            {userReservations.map((r) => (
              <div key={r.id} className="card" style={styles.reservationCard}>
                <div style={styles.reservationSeat}>{r.seat_number}</div>
                <div style={styles.reservationTime}>
                  {formatTime(r.start_time)}
                </div>
                <div style={{ ...styles.reservationStatus,
                  color: r.status === 'active' ? '#E74C3C' : '#F1C40F' }}>
                  {r.status === 'active' ? '使用中' : '待开始'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-transition" style={styles.container}>
        <h1 style={styles.pageTitle}>座位预约</h1>

        <div style={styles.floorSelector}>
          {[1, 2, 3].map((f) => (
            <button
              key={f}
              className="btn"
              onClick={() => setFloor(f)}
              style={{
                ...styles.floorBtn,
                backgroundColor: floor === f ? 'var(--accent-color)' : 'var(--gray-bg)',
                color: floor === f ? 'white' : 'var(--primary-color)',
              }}
            >
              {f}楼
            </button>
          ))}
        </div>

        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#27AE60' }} />
            <span>空闲</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#F1C40F' }} />
            <span>已预约</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#E74C3C' }} />
            <span>占用中</span>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : (
          <div className="card" style={styles.seatGridContainer}>
            <div style={styles.seatGrid}>
              {gridSeats.map((row, rowIndex) =>
                row.map((seat, colIndex) =>
                  seat ? (
                    <SeatCard
                      key={seat.id}
                      seat={seat}
                      onClick={handleSeatClick}
                    />
                  ) : (
                    <div key={`empty-${rowIndex}-${colIndex}`} />
                  )
                )
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && selectedSeat && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>预约座位</h2>
            <p style={styles.modalSubtitle}>
              座位号: <strong>{selectedSeat.seat_number}</strong> ({floor}楼)
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>预约日期</label>
              <input
                type="date"
                className="input"
                value={reserveDate}
                onChange={(e) => setReserveDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                max={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  return d.toISOString().split('T')[0];
                })()}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>开始时间（整点）</label>
              <select
                className="input"
                value={reserveHour}
                onChange={(e) => setReserveHour(e.target.value)}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>预约时长</label>
              <div style={styles.durationOptions}>
                {[1, 2, 3, 4].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="btn"
                    onClick={() => setDuration(d)}
                    style={{
                      ...styles.durationBtn,
                      backgroundColor: duration === d ? 'var(--accent-color)' : 'var(--gray-bg)',
                      color: duration === d ? 'white' : 'var(--primary-color)',
                    }}
                  >
                    {d}小时
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                style={styles.cancelBtn}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleReserve}>
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .seat-card:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .seat-card:active {
          transform: scale(0.97);
        }

        @media (max-width: 1024px) and (min-width: 769px) {
          .seat-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .seat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    marginBottom: '20px',
  },
  floorSelector: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
  },
  floorBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  legend: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    padding: '12px 16px',
    backgroundColor: 'var(--light-gray)',
    borderRadius: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--primary-color)',
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#7F8C8D',
  },
  seatGridContainer: {
    padding: '24px',
  },
  seatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '10px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    marginBottom: '8px',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#7F8C8D',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--primary-color)',
    marginBottom: '8px',
  },
  durationOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  durationBtn: {
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelBtn: {
    backgroundColor: 'var(--gray-bg)',
    color: 'var(--primary-color)',
  },
  notification: {
    backgroundColor: 'white',
  },
  reminderBanner: {
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    backgroundColor: '#FFF9C4',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: 50,
    fontSize: '14px',
    color: '#795548',
  },
  reminderClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#795548',
  },
  reservationBar: {
    backgroundColor: 'var(--gray-bg)',
    padding: '16px 20px',
    marginTop: '60px',
  },
  reservationTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--primary-color)',
    marginBottom: '10px',
  },
  reservationScroll: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  reservationCard: {
    flex: '0 0 auto',
    padding: '12px 16px',
    minWidth: '140px',
    backgroundColor: 'white',
  },
  reservationSeat: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'var(--accent-color)',
    marginBottom: '4px',
  },
  reservationTime: {
    fontSize: '12px',
    color: '#7F8C8D',
    marginBottom: '4px',
  },
  reservationStatus: {
    fontSize: '12px',
    fontWeight: 500,
  },
};

export default SeatMap;
