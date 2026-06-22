import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from '@/pages/Login';
import PreferencePage from '@/pages/PreferencePage';
import OfficeMapPage from '@/pages/OfficeMapPage';
import { useAppStore } from '@/store';
import { getUsers, getPreferences } from '@/utils/api';

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const setUsers = useAppStore((s) => s.setUsers);
  const setPreferences = useAppStore((s) => s.setPreferences);

  useEffect(() => {
    Promise.all([getUsers(), getPreferences()])
      .then(([users, prefs]) => {
        setUsers(users);
        setPreferences(prefs);
      })
      .catch((err) => console.error('加载初始数据失败', err));
  }, [setUsers, setPreferences]);

  useEffect(() => {
    if (!currentUser && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (currentUser && location.pathname === '/login') {
      navigate('/preference', { replace: true });
    } else if (location.pathname === '/' || location.pathname === '') {
      navigate(currentUser ? '/preference' : '/login', { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/preference" element={<PreferencePage />} />
      <Route path="/office-map" element={<OfficeMapPage />} />
      <Route path="*" element={<Navigate to={currentUser ? '/preference' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="app-root">
      <AppRoutes />
    </div>
  );
}
