import React, { useState, useEffect, memo } from 'react';
import { useBookingStore, Booking } from '../store/bookingStore';

interface ConfirmModalProps {
  booking: Booking;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = memo(({ booking, onConfirm, onCancel }: ConfirmModalProps) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">确认取消预订</h3>
        <p className="modal-message">
          确定要取消 {booking.resourceType === 'desk' ? '工位' : '会议室'} {booking.resourceId} 的预订吗？
          <br />
          预订人：{booking.userName}
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>
            取消
          </button>
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmModal.displayName = 'ConfirmModal';

function AdminPage() {
  const { bookings, fetchBookings, removeBooking } = useBookingStore();
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const date = `${d.getMonth() + 1}月${d.getDate()}日`;
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return `${date} ${time}`;
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await removeBooking(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <h1 className="page-title">预订管理</h1>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">暂无预订记录</div>
        </div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>资源类型</th>
                <th>资源编号</th>
                <th>用户名</th>
                <th>时间段</th>
                <th>用途</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.resourceType === 'desk' ? '工位' : '会议室'}</td>
                  <td>{b.resourceId}</td>
                  <td>{b.userName}</td>
                  <td>
                    {formatDateTime(b.startTime)} - {formatDateTime(b.endTime).split(' ')[1]}
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.purpose}
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => setDeleteTarget(b)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          booking={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default AdminPage;
