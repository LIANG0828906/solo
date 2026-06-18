import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

interface BookingCardProps {
  booking: Booking;
}

const BookingCard: React.FC<BookingCardProps> = React.memo(({ booking }) => {
  const isDark = useThemeStore((s) => s.isDark);
  const borderColor = booking.resourceType === 'desk' ? '#3B82F6' : '#8B5CF6';

  return (
    <div
      className="fade-in"
      style={{
        width: '280px',
        height: '160px',
        borderRadius: '12px',
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '16px',
        borderLeft: `4px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px) scale(1.02)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0) scale(1)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '20px' }}>
          {booking.resourceType === 'desk' ? '🖥️' : '🏢'}
        </span>
        <span
          style={{
            fontSize: '12px',
            color: isDark ? '#9CA3AF' : '#6B7280',
          }}
        >
          {booking.resourceType === 'desk' ? '工位' : '会议室'}
        </span>
      </div>
      <div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '4px',
            color: isDark ? '#F9FAFB' : '#111827',
          }}
        >
          {booking.resourceId} · {booking.userName}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: isDark ? '#D1D5DB' : '#4B5563',
            marginBottom: '4px',
          }}
        >
          {formatTimeRange(booking.startTime, booking.endTime)}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: isDark ? '#9CA3AF' : '#6B7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={booking.purpose}
        >
          {booking.purpose.length > 30 ? booking.purpose.slice(0, 30) + '…' : booking.purpose}
        </div>
      </div>
    </div>
  );
});

BookingCard.displayName = 'BookingCard';

const BookingPage: React.FC = () => {
  const isDark = useThemeStore((s) => s.isDark);
  const bookings = useBookingStore((s) => s.bookings);
  const error = useBookingStore((s) => s.error);
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  const addBooking = useBookingStore((s) => s.addBooking);
  const clearError = useBookingStore((s) => s.clearError);

  const [resourceType, setResourceType] = useState<'desk' | 'room'>('desk');
  const [resourceId, setResourceId] = useState('');
  const [userName, setUserName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [bookings]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!startDate || !startTime || !endDate || !endTime) return;

      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);

      const success = await addBooking({
        resourceType,
        resourceId,
        userName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        purpose,
      });

      if (success) {
        setResourceId('');
        setUserName('');
        setStartDate('');
        setStartTime('');
        setEndDate('');
        setEndTime('');
        setPurpose('');
      }
    },
    [resourceType, resourceId, userName, startDate, startTime, endDate, endTime, purpose, addBooking]
  );

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
    backgroundColor: isDark ? '#374151' : '#FFFFFF',
    color: isDark ? '#F9FAFB' : '#111827',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    color: isDark ? '#D1D5DB' : '#374151',
  };

  return (
    <div style={{ paddingTop: '88px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {showError && error && (
        <div
          className="fade-in"
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            marginBottom: '24px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: isDark ? '#374151' : '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '32px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: isDark ? '#F9FAFB' : '#111827' }}>
          新建预订
        </h2>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>资源类型</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setResourceType('desk')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${resourceType === 'desk' ? '#3B82F6' : isDark ? '#4B5563' : '#D1D5DB'}`,
                    backgroundColor: resourceType === 'desk' ? '#3B82F6' : isDark ? '#374151' : '#FFFFFF',
                    color: resourceType === 'desk' ? '#FFFFFF' : isDark ? '#F9FAFB' : '#111827',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🖥️ 工位
                </button>
                <button
                  type="button"
                  onClick={() => setResourceType('room')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${resourceType === 'room' ? '#8B5CF6' : isDark ? '#4B5563' : '#D1D5DB'}`,
                    backgroundColor: resourceType === 'room' ? '#8B5CF6' : isDark ? '#374151' : '#FFFFFF',
                    color: resourceType === 'room' ? '#FFFFFF' : isDark ? '#F9FAFB' : '#111827',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🏢 会议室
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>资源编号</label>
              <input
                type="text"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                placeholder="如：A01 / Room-201"
                required
                style={inputBaseStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#4B5563' : '#D1D5DB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>用户名</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="请输入您的姓名"
                required
                style={inputBaseStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#4B5563' : '#D1D5DB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={inputBaseStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#4B5563' : '#D1D5DB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>开始时间</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step={900}
                required
                style={inputBaseStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#4B5563' : '#D1D5DB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={inputBaseStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#4B5563' : '#D1D5DB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>结束时间</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step={900}
                required
                style={inputBaseStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#4B5563' : '#D1D5DB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>用途描述（最多100字）</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value.slice(0, 100))}
              placeholder="请描述预订用途..."
              rows={3}
              maxLength={100}
              required
              style={{
                ...inputBaseStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = isDark ? '#4B5563' : '#D1D5DB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '12px', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: '4px' }}>
              {purpose.length}/100
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            提交预订
          </button>
        </form>
      </div>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: isDark ? '#F9FAFB' : '#111827' }}>
          当前预订 ({sortedBookings.length})
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {sortedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
          {sortedBookings.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '48px',
                color: isDark ? '#9CA3AF' : '#6B7280',
                fontSize: '14px',
              }}
            >
              暂无预订记录，快来创建第一个预订吧！
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
