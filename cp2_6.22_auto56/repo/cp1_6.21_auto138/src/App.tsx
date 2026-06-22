import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { WeeklyReportProvider, useWeeklyReport } from './context';
import Editor from './Editor';
import Archive from './Archive';

const Navigation: React.FC = () => {
  const { users, currentUser, setCurrentUser } = useWeeklyReport();
  const location = useLocation();
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  return (
    <nav style={{
      height: '64px',
      backgroundColor: '#1E293B',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>
          团队周报
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            to="/"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: location.pathname === '/' ? 'white' : '#94A3B8',
              backgroundColor: location.pathname === '/' ? '#334155' : 'transparent',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'all 200ms ease-in-out',
            }}
          >
            协作编辑
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          to="/archive"
          title="查看归档"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: location.pathname === '/archive' ? '#334155' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 200ms ease-in-out',
            color: location.pathname === '/archive' ? 'white' : '#94A3B8',
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== '/archive') {
              e.currentTarget.style.backgroundColor = '#334155';
              e.currentTarget.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/archive') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94A3B8';
            }
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </Link>

        <div style={{ width: '1px', height: '28px', backgroundColor: '#334155' }} />

        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredUser(user.id)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              <button
                onClick={() => setCurrentUser(user)}
                title={user.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: user.color,
                  border: currentUser.id === user.id ? '3px solid white' : '3px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease-in-out',
                  boxShadow: currentUser.id === user.id ? `0 0 0 2px ${user.color}` : 'none',
                }}
              >
                {user.name.charAt(0)}
              </button>
              {hoveredUser === user.id && (
                <div
                  style={{
                    position: 'absolute',
                    top: '48px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1E293B',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 100,
                  }}
                >
                  {user.name}
                  {currentUser.id === user.id && (
                    <span style={{ color: '#22C55E', marginLeft: '6px' }}>●</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/archive" element={<Archive />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <WeeklyReportProvider>
      <AppContent />
    </WeeklyReportProvider>
  );
};

export default App;
