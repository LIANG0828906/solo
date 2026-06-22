import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '../types';

interface StatusPanelProps {
  onClose?: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const mo = (d.getMonth() + 1).toString().padStart(2, '0');
  const da = d.getDate().toString().padStart(2, '0');
  return `${mo}-${da}`;
}

export default function StatusPanel({ onClose }: StatusPanelProps) {
  const navigate = useNavigate();
  const { bookings, stations, removeBooking } = useStore();

  const userBookings = bookings.slice(0, 5);

  const getStationName = (stationId: string): string => {
    return stations.find((s) => s.id === stationId)?.name || '未知充电站';
  };

  const handleCancel = async (id: string) => {
    try {
      await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      removeBooking(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1E1E2ECC',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 600 }}>
          我的预约
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
              transition: 'all 0.2s ease',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {userBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                color: '#888888',
                textAlign: 'center',
                padding: '40px 16px',
                fontSize: 14,
              }}
            >
              暂无预约记录
              <div style={{ marginTop: 8, fontSize: 12 }}>
                点击地图上的充电桩开始预约
              </div>
            </motion.div>
          ) : (
            userBookings.map((booking) => (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  padding: 12,
                  borderLeft: `4px solid ${BOOKING_STATUS_COLORS[booking.status]}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      color: '#121212',
                      fontWeight: 600,
                      fontSize: 14,
                      flex: 1,
                    }}
                  >
                    {getStationName(booking.stationId)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: `${BOOKING_STATUS_COLORS[booking.status]}20`,
                      color: BOOKING_STATUS_COLORS[booking.status],
                      fontWeight: 500,
                    }}
                  >
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </span>
                </div>

                <div style={{ color: '#666666', fontSize: 12, display: 'flex', gap: 8 }}>
                  <span>{formatDate(booking.startTime)}</span>
                  <span>
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <span style={{ color: '#FF9800', fontWeight: 600, fontSize: 14 }}>
                    ¥
                    {(booking.cost ?? ((booking.endTime - booking.startTime) / 60000) * 0.5).toFixed(2)}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {booking.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/report/${booking.id}`)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: '#4CAF50',
                          color: '#FFFFFF',
                          fontSize: 12,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        查看报告
                      </button>
                    )}
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: '#F44336',
                          color: '#FFFFFF',
                          fontSize: 12,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
