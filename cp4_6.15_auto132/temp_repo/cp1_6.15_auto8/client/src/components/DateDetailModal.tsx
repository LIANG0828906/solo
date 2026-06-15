import { Booking, Device } from '../types';
import { formatDateChinese } from '../utils/dateUtils';
import '../styles/Modal.css';

interface DateDetailModalProps {
  date: Date;
  bookings: Booking[];
  getDeviceById: (id: string) => Device | undefined;
  onClose: () => void;
}

function DateDetailModal({ date, bookings, getDeviceById, onClose }: DateDetailModalProps) {
  const formatDateFull = (d: Date): string => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getFullYear()}年${formatDateChinese(d)} ${weekdays[d.getDay()]}`;
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 {formatDateFull(date)}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-bookings">
            <span className="empty-icon">🌿</span>
            <p>这天还没有预约</p>
            <p className="empty-sub">去右侧设备面板预约一个吧～</p>
          </div>
        ) : (
          <div className="booking-list">
            <p className="booking-count">共 {bookings.length} 个预约</p>
            <div className="booking-items">
              {bookings.map((booking, index) => {
                const device = getDeviceById(booking.deviceId);
                return (
                  <div
                    key={booking.id}
                    className="booking-item"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="booking-item-icon">
                      {device?.icon}
                    </div>
                    <div className="booking-item-content">
                      <div className="booking-item-title">
                        <span className="booking-device-name">{device?.name}</span>
                        <span className="booking-user">@{booking.userName}</span>
                      </div>
                      {booking.note && (
                        <p className="booking-note">{booking.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DateDetailModal;
