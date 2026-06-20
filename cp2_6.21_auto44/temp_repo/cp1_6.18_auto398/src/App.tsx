import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from './store';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import ShelfDashboard from './pages/ShelfDashboard';
import BookDetailPage from './pages/BookDetailPage';
import AddBookPage from './pages/AddBookPage';
import ShelfListPage from './pages/ShelfListPage';
import ShelfDetailPage from './pages/ShelfDetailPage';
import SharePage from './shelves/SharePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <main style={{ flex: 1, padding: '28px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
      <footer
        style={{
          padding: '24px 28px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
          borderTop: '1px solid var(--glass-border)',
        }}
      >
        韵动书架 · 让阅读成为一种生活方式 · © 2026
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const { isAuthenticated } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/login' && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/share/:encodedId" element={<SharePage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ShelfDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/add"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AddBookPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BookDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shelves"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ShelfListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shelf/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ShelfDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
