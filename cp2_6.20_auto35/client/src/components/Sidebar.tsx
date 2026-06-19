import React, { useState, useEffect } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { id: 'record', label: '情绪记录', icon: '📝' },
    { id: 'calendar', label: '日历', icon: '📅' },
    { id: 'analysis', label: '分析', icon: '📊' },
    { id: 'report', label: '报告', icon: '📈' },
  ];

  const svgIcons: Record<string, JSX.Element> = {
    record: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    calendar: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    analysis: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    report: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  };

  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '12px 0',
          zIndex: 100,
          animation: 'slideInUp 0.3s ease',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? '#667eea' : '#999',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ transition: 'all 0.3s ease' }}>
                {svgIcons[item.id]}
              </div>
              <span style={{ fontSize: '11px', fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    width: '24px',
                    height: '3px',
                    borderRadius: '2px',
                    background: '#667eea',
                    transition: 'all 0.3s ease',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        width: '240px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        animation: 'slideInLeft 0.5s ease',
      }}
    >
      <div style={{ marginBottom: '48px', padding: '0 12px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
          }}
        >
          心情日记
        </h1>
        <p style={{ fontSize: '13px', color: '#999', marginTop: '4px', margin: 0 }}>
          记录每一份情绪
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))'
                  : 'transparent',
                color: isActive ? '#667eea' : '#666',
                fontSize: '15px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  fill: isActive ? '#667eea' : 'none',
                }}
              >
                {svgIcons[item.id]}
              </div>
              <span style={{ transition: 'all 0.3s ease' }}>{item.label}</span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '4px',
                    height: '24px',
                    borderRadius: '0 2px 2px 0',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          borderRadius: '16px',
          marginTop: '20px',
        }}
      >
        <p style={{ fontSize: '13px', color: '#667eea', fontWeight: 600, marginBottom: '8px' }}>
          💡 今日提示
        </p>
        <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, margin: 0 }}>
          情绪没有好坏之分，接纳每一种感受
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
