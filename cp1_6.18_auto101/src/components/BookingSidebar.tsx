import React, { useCallback, useMemo } from 'react';
import { X, CalendarX } from 'lucide-react';
import { useSeatStore } from '../stores/seatStore';
import { BookingCard } from './BookingCard';

const CURRENT_USER_ID = 'user-001';

export const BookingSidebar: React.FC = () => {
  const isOpen = useSeatStore((s) => s.isSidebarOpen);
  const toggleSidebar = useSeatStore((s) => s.toggleSidebar);
  const bookings = useSeatStore((s) => s.bookings);
  const cancelBooking = useSeatStore((s) => s.cancelBooking);

  const activeBookings = useMemo(() => {
  const now = Date.now();
  return bookings
    .filter((b) => b.userId === CURRENT_USER_ID && b.endTime > now)
    .sort((a, b) => a.startTime - b.startTime);
}, [bookings]);

  const handleCancel = useCallback(
    (bookingId: string) => {
      if (window.confirm('确定要取消此预约吗？')) {
        cancelBooking(bookingId);
      }
    },
    [cancelBooking]
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={() => toggleSidebar(false)}
        className="animate-fade-in"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 50,
        }}
      />
      <aside
        className="animate-slide-in-right"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 300,
          backgroundColor: '#1E1E2E',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(99, 110, 114, 0.2)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px',
            borderBottom: '1px solid rgba(99, 110, 114, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: 'rgba(78, 205, 196, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarX size={18} color="#4ECDC4" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#E0E0E0' }}>
                我的预约
              </div>
              <div style={{ fontSize: 12, color: '#A0A0B0' }}>
                共 {activeBookings.length} 个有效预约
              </div>
            </div>
          </div>
          <button
            className="btn-hover"
            onClick={() => toggleSidebar(false)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'rgba(99, 110, 114, 0.2)',
              color: '#A0A0B0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div
          className="scrollbar-thin"
          style={{
            flex: 1,
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {activeBookings.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: '#A0A0B0',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99, 110, 114, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <CalendarX size={28} color="#636E72" />
              </div>
              <div style={{ fontSize: 14, marginBottom: 4 }}>暂无预约</div>
              <div style={{ fontSize: 12, color: '#636E72' }}>
                点击座位地图中的空闲座位进行预约
              </div>
            </div>
          ) : (
            activeBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
};
