import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { UserRole } from '../../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { role, setRole, notifications, markNotificationRead, currentUserName } = useAppStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

  const navItems: { key: string; label: string; roles: UserRole[] }[] = [
    { key: 'teacher', label: '创建作业', roles: ['teacher'] },
    { key: 'student', label: '提交代码', roles: ['student'] },
    { key: 'review', label: '同行互评', roles: ['student'] },
    { key: 'stats', label: '统计面板', roles: ['teacher'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'assignment': return '📚';
      case 'review_received': return '⭐';
      case 'review_submitted': return '✅';
      default: return '📢';
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      background: '#455a64',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: '#607d8b',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 'bold',
        }}>
          {'</>'}
        </div>
        <span style={{ fontSize: '18px', fontWeight: 600 }}>代码互评系统</span>

        <div style={{ display: 'flex', gap: '4px', marginLeft: '24px' }} className="desktop-nav">
          {visibleItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                background: currentPage === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.key) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.key) e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', opacity: 0.85 }}>{currentUserName}</span>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{
              background: 'transparent', border: 'none', color: 'white',
              fontSize: '20px', cursor: 'pointer', padding: '4px 8px',
              position: 'relative', borderRadius: '6px',
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                background: '#e53935', color: 'white',
                fontSize: '10px', fontWeight: 'bold',
                minWidth: '16px', height: '16px',
                borderRadius: '8px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div style={{
              position: 'absolute', top: '44px', right: 0,
              width: '320px', maxHeight: '400px', overflowY: 'auto',
              background: 'white', color: '#37474f',
              borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              zIndex: 200,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: 600 }}>
                通知
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9e9e9e', fontSize: '13px' }}>
                  暂无通知
                </div>
              ) : (
                notifications.map((n) => {
                  const isOld = n.createdAt < threeDaysAgo;
                  return (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f5f5f5',
                        cursor: 'pointer',
                        opacity: isOld ? 0.5 : 1,
                        background: n.read ? '#fafafa' : 'white',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px' }}>{getNotifIcon(n.type)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', marginBottom: '4px' }}>{n.message}</div>
                          <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{formatTime(n.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div ref={roleRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', padding: '6px 12px', borderRadius: '6px',
              fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {role === 'teacher' ? '👨‍🏫 教师' : '👨‍🎓 学生'}
            <span style={{ fontSize: '10px' }}>▼</span>
          </button>

          {showRoleMenu && (
            <div style={{
              position: 'absolute', top: '40px', right: 0,
              background: 'white', color: '#37474f',
              borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden', zIndex: 200, minWidth: '140px',
            }}>
              {(['teacher', 'student'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setShowRoleMenu(false);
                    if (r === 'teacher') onNavigate('teacher');
                    else onNavigate('student');
                  }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 16px', background: role === r ? '#e3f2fd' : 'white',
                    border: 'none', fontSize: '13px', cursor: 'pointer',
                    color: role === r ? '#1976d2' : '#37474f',
                  }}
                >
                  {r === 'teacher' ? '👨‍🏫 教师模式' : '👨‍🎓 学生模式'}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'transparent', border: 'none', color: 'white',
            fontSize: '22px', cursor: 'pointer', padding: '4px 8px',
          }}
        >
          ☰
        </button>
      </div>

      {mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: '56px', left: 0, right: 0,
          background: '#455a64', padding: '8px 0',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }} className="mobile-nav">
          {visibleItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.key);
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 20px',
                background: currentPage === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none', color: 'white', fontSize: '14px', cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
};
