import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatRelativeTime } from '../utils/dataManager';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount, notifications, markAllNotificationsRead } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleAdminClick = () => {
    const password = prompt('请输入管理员密码：');
    if (password === 'admin123') {
      navigate('/dashboard');
    } else if (password !== null) {
      alert('密码错误！');
    }
    setShowMenu(false);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          height: '100%',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '20px',
            fontWeight: 700,
            color: '#10B981',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '24px' }}>💚</span>
          <span>公益捐助</span>
        </Link>

        <div style={{ flex: 1, maxWidth: '400px', display: 'flex' }}>
          <input
            type="text"
            placeholder="搜索物品..."
            style={{
              width: '100%',
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                navigate(`/?search=${encodeURIComponent(target.value)}`);
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', display: 'none' }} className="desktop-notif">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '8px',
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>通知</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      style={{
                        fontSize: '12px',
                        color: '#10B981',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      全部已读
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                    暂无通知
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: n.read ? 'transparent' : '#F0FDF4',
                      }}
                    >
                      <div style={{ fontSize: '13px', color: '#1F2937' }}>{n.message}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                        {formatRelativeTime(n.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'relative', display: 'none' }} className="desktop-admin">
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                padding: '6px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              管理
            </button>
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  minWidth: '150px',
                }}
              >
                <button
                  onClick={handleAdminClick}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  统计看板
                </button>
              </div>
            )}
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: 'block',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div
          className="mobile-menu"
          style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '8px 0',
          }}
        >
          <div
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              color: '#374151',
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            🔔 通知 ({unreadCount})
          </div>
          <button
            onClick={handleAdminClick}
            style={{
              width: '100%',
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            📊 统计看板
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 640px) {
          .mobile-menu-btn { display: none !important; }
          .desktop-notif { display: block !important; }
          .desktop-admin { display: block !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
