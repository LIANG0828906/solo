import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useFacilityStore } from './module/facility/facilityStore';
import AdminDashboard from './module/ui/AdminDashboard';
import UserFacilityView from './module/ui/UserFacilityView';
import UserProfile from './module/ui/UserProfile';

function Notification() {
  const notification = useFacilityStore((s) => s.notification);

  if (!notification) return null;

  return (
    <div className={`notification ${notification.type}`}>
      {notification.type === 'success' && <span style={{ marginRight: '8px' }}>✓</span>}
      {notification.type === 'error' && <span style={{ marginRight: '8px' }}>✕</span>}
      {notification.type === 'info' && <span style={{ marginRight: '8px' }}>ℹ</span>}
      {notification.message}
    </div>
  );
}

function UserSwitcher() {
  const { users, currentUser, setCurrentUser } = useFacilityStore();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 50,
        padding: '12px 16px',
        background: 'var(--bg-white)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>切换用户：</span>
      <select
        value={currentUser?.id || ''}
        onChange={(e) => setCurrentUser(e.target.value)}
        style={{
          padding: '6px 10px',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          fontSize: '13px',
          background: 'var(--bg-white)',
          cursor: 'pointer',
        }}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role === 'admin' ? '管理员' : '住户'})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function App() {
  const { init, loading, currentUser } = useFacilityStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!loading && currentUser && location.pathname === '/admin' && currentUser.role !== 'admin') {
      navigate('/');
    }
  }, [loading, currentUser, location.pathname, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}>🏘️</div>
          <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<UserFacilityView />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Notification />
      <UserSwitcher />
    </>
  );
}
