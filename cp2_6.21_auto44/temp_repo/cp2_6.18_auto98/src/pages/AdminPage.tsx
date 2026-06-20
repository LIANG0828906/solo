import React, { useState, useEffect, useMemo } from 'react';
import { useBookingStore, Booking } from '../store/bookingStore';
import { useThemeStore } from '../store/themeStore';

const formatTimeRange = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const sH = String(start.getHours()).padStart(2, '0');
  const sM = String(start.getMinutes()).padStart(2, '0');
  const eH = String(end.getHours()).padStart(2, '0');
  const eM = String(end.getMinutes()).padStart(2, '0');
  return `${start.getMonth() + 1}月${start.getDate()}日 ${sH}:${sM}-${eH}:${eM}`;
};

interface ConfirmDialogProps {
  visible: boolean;
  booking: Booking | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = React.memo(({ visible, booking, onConfirm, onCancel }) => {
  const isDark = useThemeStore((s) => s.isDark);

  if (!visible || !booking) return null;

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#00000080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: isDark ? '#374151' : '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: isDark ? '#F9FAFB' : '#111827' }}>
          确认取消预订
        </h3>
        <p style={{ fontSize: '14px', color: isDark ? '#D1D5DB' : '#4B5563', marginBottom: '8px' }}>
          资源：{booking.resourceType === 'desk' ? '工位' : '会议室'} {booking.resourceId}
        </p>
        <p style={{ fontSize: '14px', color: isDark ? '#D1D5DB' : '#4B5563', marginBottom: '8px' }}>
          预订人：{booking.userName}
        </p>
        <p style={{ fontSize: '14px', color: isDark ? '#D1D5DB' : '#4B5563', marginBottom: '24px' }}>
          时间：{formatTimeRange(booking.startTime, booking.endTime)}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
              backgroundColor: 'transparent',
              color: isDark ? '#D1D5DB' : '#4B5563',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDark ? '#4B5563' : '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#DC2626';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#EF4444';
            }}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

const AdminPage: React.FC = () => {
  const isDark = useThemeStore((s) => s.isDark);
  const bookings = useBookingStore((s) => s.bookings);
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  const removeBooking = useBookingStore((s) => s.removeBooking);

  const [showDialog, setShowDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [bookings]);

  const handleDeleteClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDialog(true);
  };

  const handleConfirm = async () => {
    if (selectedBooking) {
      await removeBooking(selectedBooking.id);
      setShowDialog(false);
      setSelectedBooking(null);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setSelectedBooking(null);
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: isDark ? '#9CA3AF' : '#6B7280',
    borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
  };

  return (
    <div style={{ paddingTop: '88px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: isDark ? '#F9FAFB' : '#111827' }}>
        预订管理 ({sortedBookings.length})
      </h2>

      <div
        style={{
          backgroundColor: isDark ? '#374151' : '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>资源类型</th>
                <th style={thStyle}>资源编号</th>
                <th style={thStyle}>用户名</th>
                <th style={thStyle}>时间段</th>
                <th style={thStyle}>用途</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking, index) => (
                <tr
                  key={booking.id}
                  className="fade-in"
                  style={{
                    backgroundColor: index % 2 === 0 ? (isDark ? '#374151' : '#FFFFFF') : (isDark ? '#1F2937' : '#F9FAFB'),
                  }}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: isDark ? '#D1D5DB' : '#374151',
                      borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    }}
                  >
                    {booking.resourceType === 'desk' ? '🖥️ 工位' : '🏢 会议室'}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: isDark ? '#F9FAFB' : '#111827',
                      fontWeight: 500,
                      borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    }}
                  >
                    {booking.resourceId}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: isDark ? '#D1D5DB' : '#374151',
                      borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    }}
                  >
                    {booking.userName}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: isDark ? '#D1D5DB' : '#374151',
                      borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatTimeRange(booking.startTime, booking.endTime)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: isDark ? '#9CA3AF' : '#6B7280',
                      borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={booking.purpose}
                  >
                    {booking.purpose}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    }}
                  >
                    <button
                      onClick={() => handleDeleteClick(booking)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#DC2626';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#EF4444';
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {sortedBookings.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '48px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: isDark ? '#9CA3AF' : '#6B7280',
                    }}
                  >
                    暂无预订记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        visible={showDialog}
        booking={selectedBooking}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminPage;
