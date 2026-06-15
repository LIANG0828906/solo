import { useState, useEffect, useMemo } from 'react';
import { Device, Booking } from '../types';
import { isBeforeToday } from '../utils/dateUtils';
import VirtualList from './VirtualList';
import { fetchWithCache, invalidateCacheByPrefix } from '../utils/apiCache';
import '../styles/Modal.css';

interface HistoryModalProps {
  device: Device;
  onClose: () => void;
  onDeleted: () => void;
}

const HISTORY_ITEM_HEIGHT = 82;
const VIRTUAL_LIST_HEIGHT = 380;
const VIRTUAL_THRESHOLD = 15;

function HistoryModal({ device, onClose, onDeleted }: HistoryModalProps) {
  const [history, setHistory] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [device.id]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithCache<Booking[]>(
        `/api/devices/${device.id}/history`,
        undefined,
        15 * 1000
      );
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((b) => b.id !== bookingId));
        invalidateCacheByPrefix('GET:/api');
        onDeleted();
      }
    } catch (err) {
      console.error('Failed to delete booking:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${weekdays[date.getDay()]}`;
  };

  const pastBookings = useMemo(
    () => history.filter((b) => isBeforeToday(b.date)),
    [history]
  );
  const futureBookings = useMemo(
    () => history.filter((b) => !isBeforeToday(b.date)),
    [history]
  );

  const renderHistoryItem = (booking: Booking, globalIndex: number, style: React.CSSProperties) => {
    const isPast = isBeforeToday(booking.date);
    return (
      <div
        key={booking.id}
        className="history-item fade-in-stagger"
        style={{
          ...style,
          animationDelay: `${Math.min(globalIndex * 0.04, 0.6)}s`,
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'var(--color-wood-pale)',
          borderRadius: 'var(--radius-md)',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <div className="history-item-left">
          <span className="history-date">{formatDate(booking.date)}</span>
          <span className={`history-status ${isPast ? 'past' : 'future'}`}>
            {isPast ? '✅ 已完成' : '⏳ 待使用'}
          </span>
        </div>
        <div className="history-item-right">
          <span className="history-user">@{booking.userName}</span>
          {booking.note && <p className="history-note">{booking.note}</p>}
          {isPast ? (
            deleteConfirm === booking.id ? (
              <div className="delete-confirm">
                <span>确认删除？</span>
                <button
                  className="confirm-btn confirm-yes"
                  onClick={() => handleDelete(booking.id)}
                >
                  是
                </button>
                <button
                  className="confirm-btn confirm-no"
                  onClick={() => setDeleteConfirm(null)}
                >
                  否
                </button>
              </div>
            ) : (
              <button
                className="delete-btn"
                onClick={() => setDeleteConfirm(booking.id)}
                title="删除记录"
              >
                🗑️ 删除
              </button>
            )
          ) : (
            <span className="delete-disabled" title="未来记录不可删除">
              🔒 不可删除
            </span>
          )}
        </div>
      </div>
    );
  };

  const allHistory = useMemo(
    () => [...futureBookings, ...pastBookings],
    [futureBookings, pastBookings]
  );

  const useVirtualList = allHistory.length > VIRTUAL_THRESHOLD;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal-content history-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <span>{device.icon}</span>
            {device.name} · 借用记录
            <span className="history-count-badge">{history.length}</span>
          </h2>
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
            <p className="empty-sub">去预约一下试试吧～</p>
          </div>
        ) : (
          <div className="history-content">
            {futureBookings.length > 0 && !useVirtualList && (
              <div className="history-section">
                <h3 className="history-section-title">
                  <span className="section-dot future" />
                  即将使用 ({futureBookings.length})
                </h3>
                <div className="history-list">
                  {futureBookings.map((booking, index) =>
                    renderHistoryItem(booking, index, {})
                  )}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && !useVirtualList && (
              <div className="history-section">
                <h3 className="history-section-title">
                  <span className="section-dot past" />
                  历史记录 ({pastBookings.length})
                </h3>
                <div className="history-list">
                  {pastBookings.map((booking, index) =>
                    renderHistoryItem(booking, futureBookings.length + index, {})
                  )}
                </div>
              </div>
            )}

            {useVirtualList && (
              <div>
                <div className="history-section-title">
                  全部记录 ({allHistory.length})
                  <span className="virtual-hint">（虚拟滚动优化）</span>
                </div>
                <VirtualList
                  items={allHistory}
                  itemHeight={HISTORY_ITEM_HEIGHT}
                  containerHeight={VIRTUAL_LIST_HEIGHT}
                  renderItem={renderHistoryItem}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryModal;
