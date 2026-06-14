import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

const BountyMap = React.lazy(() => import('./components/BountyMap'));
const TaskHall = React.lazy(() => import('./components/TaskHall'));
const Profile = React.lazy(() => import('./components/Profile'));
const Login = React.lazy(() => import('./components/Login'));

function AuthRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function LoginRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppLayout({ user, refreshUser }: { user: any; refreshUser: () => void }) {
  const location = useLocation();

  const tabs = [
    { path: '/', label: '寻宝地图', icon: '🗺️' },
    { path: '/tasks', label: '任务大厅', icon: '📜' },
    { path: '/profile', label: '玩家档案', icon: '👤' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f1a', color: '#fff' }}>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: 'rgba(15, 15, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 100,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: 2 }}>城市寻宝</h1>
        {user && (
          <span style={{ fontSize: 14, color: '#aaa' }}>
            {user.nickname || user.username || user.name || '探险家'}
          </span>
        )}
      </header>

      <main
        style={{
          flex: 1,
          paddingTop: 56,
          paddingBottom: 72,
          overflowY: 'auto',
        }}
      >
        <Suspense
          fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <span style={{ color: '#888', fontSize: 16 }}>加载中...</span>
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <AuthRoute>
                  <BountyMap user={user} refreshUser={refreshUser} />
                </AuthRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <AuthRoute>
                  <TaskHall user={user} refreshUser={refreshUser} />
                </AuthRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthRoute>
                  <Profile user={user} refreshUser={refreshUser} />
                </AuthRoute>
              }
            />
            <Route
              path="/login"
              element={
                <LoginRoute>
                  <Login refreshUser={refreshUser} />
                </LoginRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          background: 'rgba(15, 15, 26, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 100,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                flex: 1,
                height: '100%',
                gap: 4,
                color: isActive ? '#e94560' : '#888',
                transition: 'color 0.2s',
              }}
            >
              <span style={{ fontSize: 24 }}>{tab.icon}</span>
              <span style={{ fontSize: 11 }}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const refreshUser = () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  return (
    <BrowserRouter>
      <AppLayout user={user} refreshUser={refreshUser} />
    </BrowserRouter>
  );
}
