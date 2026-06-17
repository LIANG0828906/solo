import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { EventEditor } from './components/EventEditor';
import { TimelineView } from './components/TimelineView';
import { CommunitySquare } from './components/CommunitySquare';
import { useTimelineStore } from './store/useTimelineStore';

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { events, currentUser, isLoggedIn, setLoggedIn } = useTimelineStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const headerStyle: React.CSSProperties = {
    padding: '14px 24px',
    backgroundColor: '#FFFBF0',
    borderBottom: '1px solid #F0E5D8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const navButtonStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: active ? '#F5E6CA' : 'transparent',
    color: active ? '#C9733F' : '#8B7A63',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#F8F4E6', display: 'flex', flexDirection: 'column' }}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #D4A373, #C9733F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <ClockIcon />
          </div>
          <div>
            <h1 style={{ color: '#5C4033', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>时光轴</h1>
            <p style={{ color: '#8B7A63', fontSize: 11 }}>记录人生每一个重要时刻</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 8 }}>
          <button
            style={navButtonStyle(location.pathname === '/')}
            onClick={() => navigate('/')}
            onMouseEnter={(e) => { if (location.pathname !== '/') { e.currentTarget.style.backgroundColor = '#FDF6E3'; } }}
            onMouseLeave={(e) => { if (location.pathname !== '/') { e.currentTarget.style.backgroundColor = 'transparent'; } }}
          >
            <HomeIcon />
            我的时间轴
          </button>
          <button
            style={navButtonStyle(location.pathname === '/community')}
            onClick={() => navigate('/community')}
            onMouseEnter={(e) => { if (location.pathname !== '/community') { e.currentTarget.style.backgroundColor = '#FDF6E3'; } }}
            onMouseLeave={(e) => { if (location.pathname !== '/community') { e.currentTarget.style.backgroundColor = 'transparent'; } }}
          >
            <GlobeIcon />
            社区广场
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#5C4033', fontSize: 13, fontWeight: 500 }}>{currentUser?.name}</span>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: '#F5E6CA',
            border: '2px solid #D4A373',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#5C4033', fontSize: 14, fontWeight: 700,
          }}>
            {currentUser?.name.charAt(0)}
          </div>
        </div>
      </header>

      <main style={{
        flex: 1,
        padding: 20,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 20,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20, flex: 1, minHeight: 0 }}>
          <EventEditor />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              padding: '0 4px',
            }}>
              <h2 style={{ color: '#5C4033', fontSize: 18, fontWeight: 700 }}>
                我的时间线
                <span style={{ color: '#8B7A63', fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
                  共 {events.length} 个事件
                </span>
              </h2>
            </div>
            <div style={{ flex: 1, minHeight: isMobile ? 500 : 0 }}>
              <TimelineView />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useTimelineStore();

  const headerStyle: React.CSSProperties = {
    padding: '14px 24px',
    backgroundColor: '#FFFBF0',
    borderBottom: '1px solid #F0E5D8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const navButtonStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: active ? '#F5E6CA' : 'transparent',
    color: active ? '#C9733F' : '#8B7A63',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#F8F4E6', display: 'flex', flexDirection: 'column' }}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #D4A373, #C9733F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <ClockIcon />
          </div>
          <div>
            <h1 style={{ color: '#5C4033', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>时光轴</h1>
            <p style={{ color: '#8B7A63', fontSize: 11 }}>记录人生每一个重要时刻</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 8 }}>
          <button
            style={navButtonStyle(location.pathname === '/')}
            onClick={() => navigate('/')}
            onMouseEnter={(e) => { if (location.pathname !== '/') { e.currentTarget.style.backgroundColor = '#FDF6E3'; } }}
            onMouseLeave={(e) => { if (location.pathname !== '/') { e.currentTarget.style.backgroundColor = 'transparent'; } }}
          >
            <HomeIcon />
            我的时间轴
          </button>
          <button
            style={navButtonStyle(location.pathname === '/community')}
            onClick={() => navigate('/community')}
            onMouseEnter={(e) => { if (location.pathname !== '/community') { e.currentTarget.style.backgroundColor = '#FDF6E3'; } }}
            onMouseLeave={(e) => { if (location.pathname !== '/community') { e.currentTarget.style.backgroundColor = 'transparent'; } }}
          >
            <GlobeIcon />
            社区广场
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#5C4033', fontSize: 13, fontWeight: 500 }}>{currentUser?.name}</span>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: '#F5E6CA',
            border: '2px solid #D4A373',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#5C4033', fontSize: 14, fontWeight: 700,
          }}>
            {currentUser?.name.charAt(0)}
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CommunitySquare />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ConsolePage />} />
      <Route path="/community" element={<CommunityPage />} />
    </Routes>
  );
};

export default App;
