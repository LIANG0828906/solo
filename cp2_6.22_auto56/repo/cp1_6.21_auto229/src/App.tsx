import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import BookSearch from './components/BookSearch';
import BookShelf from './components/BookShelf';

const sidebarStyle: React.CSSProperties = {
  width: '240px',
  minWidth: '240px',
  background: '#1E293B',
  borderRadius: '0 12px 12px 0',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  height: '100vh',
  position: 'sticky',
  top: 0,
  transition: 'all 0.3s ease',
};

const navItemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 14px',
  borderRadius: '8px',
  cursor: 'pointer',
  color: '#E2E8F0',
  background: active ? '#334155' : 'transparent',
  transition: 'background 0.2s ease',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  fontSize: '15px',
  fontFamily: 'inherit',
});

const contentStyle: React.CSSProperties = {
  flex: 1,
  background: '#0F172A',
  padding: '24px',
  borderRadius: '12px',
  minHeight: '100vh',
  overflowY: 'auto',
};

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  background: '#0F172A',
};

const logoStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#6366F1',
  marginBottom: '32px',
  padding: '8px 14px',
  letterSpacing: '2px',
};

const iconBox: React.CSSProperties = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const mobileNavStyle: React.CSSProperties = {
  display: 'none',
  width: '100%',
  height: '56px',
  background: '#1E293B',
  alignItems: 'center',
  justifyContent: 'space-around',
  padding: '0 16px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

export default function App() {
  const { activeView, setActiveView } = useApp();

  const navItems = [
    { key: 'search' as const, label: '探索书籍', icon: '🔍' },
    { key: 'shelf' as const, label: '我的书库', icon: '📚' },
    { key: 'lists' as const, label: '我的书单', icon: '📋' },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-layout { flex-direction: column !important; }
          .content-area { border-radius: 0 !important; min-height: calc(100vh - 56px) !important; }
          .card-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .card-grid { grid-template-columns: 1fr !important; }
        }
        .nav-btn:hover { background: #475569 !important; }
        .nav-btn:active { transform: scale(0.95); }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div className="main-layout" style={layoutStyle}>
        <aside className="sidebar" style={sidebarStyle}>
          <div style={logoStyle}>🏛 藏书阁</div>
          {navItems.map(item => (
            <button
              key={item.key}
              className="nav-btn"
              style={navItemStyle(activeView === item.key)}
              onClick={() => setActiveView(item.key)}
            >
              <span style={iconBox}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <nav className="mobile-nav" style={mobileNavStyle}>
          {navItems.map(item => (
            <button
              key={item.key}
              className="nav-btn"
              style={{
                ...navItemStyle(activeView === item.key),
              }}
              onClick={() => setActiveView(item.key)}
            >
              <span style={iconBox}>{item.icon}</span>
              <span style={{ fontSize: '12px' }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <main className="content-area" style={contentStyle}>
          <div className="fade-in">
            {activeView === 'search' && <BookSearch />}
            {(activeView === 'shelf' || activeView === 'lists') && <BookShelf mode={activeView} />}
          </div>
        </main>
      </div>
    </>
  );
}
