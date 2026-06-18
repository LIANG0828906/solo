import React, { useState, useEffect, useCallback, memo } from 'react';
import { useBookingStore, Booking } from '../store/bookingStore';

const BookingCard = memo(({ booking }: { booking: Booking }) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const truncate = (text: string, len: number) => {
    if (text.length <= len) return text;
    return text.slice(0, len) + '...';
  };

  return (
    <div className={`booking-card ${booking.resourceType}`}>
      <div className="card-header">
        <span className="card-icon">{booking.resourceType === 'desk' ? '🖥️' : '🏢'}</span>
        <div className="card-resource">
          <div className="card-resource-id">{booking.resourceId}</div>
          <div>{booking.resourceType === 'desk' ? '工位' : '会议室'}</div>
        </div>
      </div>
      <div className="card-body">
        <div className="card-user">{booking.userName}</div>
        <div className="card-time">
          {formatDate(booking.startTime)} {formatTime(booking.startTime)}-{formatTime(booking.endTime)}
        </div>
      </div>
      <div className="card-purpose">{truncate(booking.purpose, 30)}</div>
    </div>
  );
});

BookingCard.displayName = 'BookingCard';

function BookingPage() {
  const { bookings, fetchBookings, addBooking } = useBookingStore();

  const [resourceType, setResourceType] = useState<'desk' | 'room'>('desk');
  const [resourceId, setResourceId] = useState('');
  const [userName, setUserName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const roundTo15Minutes = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const minutes = d.getMinutes();
    const rounded = Math.round(minutes / 15) * 15;
    d.setMinutes(rounded);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d.toISOString().slice(0, 16);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resourceId.trim()) {
      setError('请输入资源编号');
      return;
    }
    if (!userName.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!startTime || !endTime) {
      setError('请选择开始和结束时间');
      return;
    }
    if (purpose.length > 100) {
      setError('用途描述不能超过100字');
      return;
    }

    const roundedStart = roundTo15Minutes(startTime);
    const roundedEnd = roundTo15Minutes(endTime);

    if (new Date(roundedStart) >= new Date(roundedEnd)) {
      setError('结束时间必须晚于开始时间');
      return;
    }

    setSubmitting(true);
    const result = await addBooking({
      resourceType,
      resourceId: resourceId.trim(),
      userName: userName.trim(),
      startTime: roundedStart,
      endTime: roundedEnd,
      purpose: purpose.trim(),
    });
    setSubmitting(false);

    if (result.success) {
      setSuccess('预订成功！');
      setResourceId('');
      setUserName('');
      setStartTime('');
      setEndTime('');
      setPurpose('');
      fetchBookings();
    } else {
      setError(result.error || '预订失败');
    }
  };

  return (
    <div>
      <h1 className="page-title">资源预订</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>{success}</div>}

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">资源类型</label>
            <select
              className="form-select"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as 'desk' | 'room')}
            >
              <option value="desk">工位</option>
              <option value="room">会议室</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">资源编号</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：D001 / M201"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入您的姓名"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="form-group"></div>
          <div className="form-group">
            <label className="form-label">开始时间</label>
            <input
              type="datetime-local"
              step="900"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">结束时间</label>
            <input
              type="datetime-local"
              step="900"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">用途（最多100字）</label>
            <textarea
              className="form-textarea"
              placeholder="请简要描述使用用途"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              maxLength={100}
            />
            <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
              {purpose.length}/100
            </div>
          </div>
        </div>
        <div style={{ marginTop: '24px' }}>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? '提交中...' : '提交预订'}
          </button>
        </div>
      </form>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>当前预订</h2>
      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <div className="empty-text">暂无预订记录</div>
        </div>
      ) : (
        <div className="booking-grid">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingPage;
