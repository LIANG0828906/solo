import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import InstrumentDetail from '@/pages/InstrumentDetail';
import PublishPage from '@/pages/PublishPage';
import ProfilePage from '@/pages/ProfilePage';
import AuthPage from '@/pages/AuthPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { fetchUser } = useStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/instrument/:id" element={<InstrumentDetail />} />
          <Route
            path="/publish"
            element={
              <RequireAuth>
                <PublishPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
