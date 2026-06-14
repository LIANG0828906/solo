import { useState, useEffect } from 'react';
import { Device, Booking } from '../types';
import { isBeforeToday } from '../utils/dateUtils';
import '../styles/Modal.css';

interface HistoryModalProps {
  device: Device;
  onClose: () => void;
  onDeleted: () => void;
}

function HistoryModal({ device, onClose, onDeleted }: HistoryModalProps) {
  const [history, setHistory] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [device.id]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/history`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((b) => b.id !== bookingId));
        onDeleted();
      }
    } catch (err) {
      console.error('Failed to delete booking:', err);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getStatusText = (dateStr: string): string => {
    return isBeforeToday(dateStr) ? '已完成' : '待使用';
  };

  const pastBookings = history.filter((b) => isBeforeToday(b.date));
  const futureBookings = history.filter((b) => !isBeforeToday(b.date));

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal-content history-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{device.icon} {device.name} · 借用记录</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="history-loading">
            <div className="loading-spinner" />
            <p>加载中...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-history">
            <span className="empty-icon">📭</span>
            <p>暂无借用记录</p>
          </div>
        ) : (
          <div className="history-content">
            {futureBookings.length > 0 && (
              <div className="history-section">
                <h3 className="history-section-title">
                  <span className="section-dot future" />
                  即将使用 ({futureBookings.length})
                </h3>
                <div className="history-list">
                  {futureBookings.map((booking, index) => (
                    <div
                      key={booking.id}
                      className="history-item fade-in-stagger"
                      style={{ animationDelay: `${index * 0.06}s` }}
                    >
                      <div className="history-item-left">
                        <span className="history-date">{formatDate(booking.date)}</span>
                        <span className="history-status future">待使用</span>
                      </div>
                      <div className="history-item-right">
                        <span className="history-user">@{booking.userName}</span>
                        {booking.note && (
                          <p className="history-note">{booking.note}</p>
                        )}
                        <span className="delete-disabled" title="未来记录不可删除">
                          🔒
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div className="history-section">
                <h3 className="history-section-title">
                  <span className="section-dot past" />
                  历史记录 ({pastBookings.length})
                </h3>
                <div className="history-list">
                  {pastBookings.map((booking, index) => (
                    <div
                      key={booking.id}
                      className="history-item fade-in-stagger"
                      style={{ animationDelay: `${(futureBookings.length + index) * 0.06}s` }}
                    >
                      <div className="history-item-left">
                        <span className="history-date">{formatDate(booking.date)}</span>
                        <span className="history-status past">已完成</span>
                      </div>
                      <div className="history-item-right">
                        <span className="history-user">@{booking.userName}</span>
                        {booking.note && (
                          <p className="history-note">{booking.note}</p>
                        )}
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(booking.id)}
                          title="删除记录"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryModal;
