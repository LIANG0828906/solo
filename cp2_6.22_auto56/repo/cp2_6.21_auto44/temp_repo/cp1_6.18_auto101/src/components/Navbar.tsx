import React, { useMemo } from 'react';
import { Calendar, User } from 'lucide-react';
import { useSeatStore } from '../stores/seatStore';

const CURRENT_USER_ID = 'user-001';

export const Navbar: React.FC = () => {
  const toggleSidebar = useSeatStore((s) => s.toggleSidebar);
  const bookings = useSeatStore((s) => s.bookings);

  const bookingCount = useMemo(() => {
    const now = Date.now();
    return bookings.filter((b) => b.userId === CURRENT_USER_ID && b.endTime > now).length;
  }, [bookings]);

  return (
    <nav
      className="glass"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderBottom: '1px solid rgba(99, 110, 114, 0.3)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: '#4ECDC4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Calendar size={20} color="#1A1A2E" strokeWidth={2.5} />
        </div>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#4ECDC4',
            letterSpacing: 1,
          }}
        >
          智选书阁
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="btn-hover"
          onClick={() => toggleSidebar(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 40,
            padding: '0 16px',
            borderRadius: 8,
            backgroundColor: 'rgba(78, 205, 196, 0.12)',
            border: '1px solid rgba(78, 205, 196, 0.3)',
            color: '#4ECDC4',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <Calendar size={16} />
          <span>我的预约</span>
          {bookingCount > 0 && (
            <span
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#FF6B6B',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}
            >
              {bookingCount}
            </span>
          )}
        </button>

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: '#636E72',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="读者"
        >
          <User size={18} color="#E0E0E0" />
        </div>
      </div>
    </nav>
  );
};
