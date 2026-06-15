import { useState } from 'react';
import type { Booking, Artist } from '../types';
import { cancelBooking } from '../utils/api';
import './BookingList.css';

interface BookingListProps {
  bookings: Booking[];
  artists: Artist[];
  onCancelSuccess: () => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function BookingList({ bookings, artists, onCancelSuccess, onToast }: BookingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const getArtist = (artistId: string) =>
    artists.find((a) => a.id === artistId);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      onToast('success', '预约已取消，时段已释放');
      onCancelSuccess();
      setExpandedId(null);
    } catch (err) {
      const error = err as Error;
      onToast('error', error.message || '取消失败');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${y}年${Number(m)}月${Number(d)}日`;
  };

  const getStatusText = (status: string) =>
    status === 'confirmed' ? '已确认' : '已取消';

  return (
    <div className="booking-list-container">
      <div className="booking-list-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <h3>我的预约</h3>
        <span className="booking-count">{bookings.length}</span>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-bookings">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>暂无预约</p>
          <span>开始预约您的第一位艺术家吧</span>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => {
            const artist = getArtist(booking.artistId);
            const isExpanded = expandedId === booking.id;
            const isCancelling = cancellingId === booking.id;
            const isConfirmed = booking.status === 'confirmed';

            return (
              <div key={booking.id} className="booking-item">
                <div
                  className={`status-bar ${isConfirmed ? 'confirmed' : 'cancelled'}`}
                />
                <div className="booking-content">
                  <button
                    className="booking-header"
                    onClick={() => toggleExpand(booking.id)}
                  >
                    {artist && (
                      <div
                        className="booking-avatar"
                        style={{ backgroundColor: artist.avatarColor }}
                      >
                        {artist.avatar}
                      </div>
                    )}
                    <div className="booking-info">
                      <div className="booking-artist">
                        {artist?.name || '未知艺术家'}
                      </div>
                      <div className="booking-meta">
                        {formatDate(booking.date)} · {String(booking.startHour).padStart(2, '0')}:00
                      </div>
                      <span className={`status-tag ${isConfirmed ? 'confirmed' : 'cancelled'}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <svg
                      className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <div className={`booking-details ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="booking-details-inner">
                      <div className="detail-row">
                        <span className="detail-label">艺术领域</span>
                        <span className="detail-value">{artist?.specialty || '-'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">预约人</span>
                        <span className="detail-value">{booking.userName}</span>
                      </div>
                      {booking.userPhone && (
                        <div className="detail-row">
                          <span className="detail-label">联系电话</span>
                          <span className="detail-value">{booking.userPhone}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">时长</span>
                        <span className="detail-value">{booking.duration} 分钟</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">预约时间</span>
                        <span className="detail-value">
                          {new Date(booking.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>

                      {isConfirmed && (
                        <button
                          className="cancel-btn"
                          onClick={() => handleCancel(booking.id)}
                          disabled={isCancelling}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                          </svg>
                          {isCancelling ? '取消中...' : '取消预约'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
