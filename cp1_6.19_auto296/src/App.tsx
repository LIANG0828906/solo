import { useEffect, ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WeeklyReportPage from './pages/WeeklyReportPage';
import useStore from './store/useStore';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = useStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

const AppRoutes = () => {
  const navigate = useNavigate();
  const token = useStore((state) => state.token);
  const location = useLocation();

  useEffect(() => {
    if (!token && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
    if (token && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
    if (token && location.pathname === '/login') {
      navigate('/dashboard', { replace: true });
    }
  }, [token, location.pathname, navigate]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/weekly-report"
          element={
            <ProtectedRoute>
              <PageTransition>
                <WeeklyReportPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return <AppRoutes />;
};

export default App;
