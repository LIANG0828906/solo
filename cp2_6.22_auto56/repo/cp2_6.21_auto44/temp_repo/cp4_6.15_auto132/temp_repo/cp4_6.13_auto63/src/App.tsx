import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';

const DashboardPage: React.FC = () => (
  <div className="page-container">
    <h2>我的书架</h2>
    <p>欢迎来到 BookDrift 控制面板！</p>
  </div>
);

const BrowsePage: React.FC = () => (
  <div className="page-container">
    <h2>浏览书籍</h2>
    <p>发现更多好书，开启漂流之旅</p>
  </div>
);

const UserProfilePage: React.FC = () => (
  <div className="page-container">
    <h2>用户主页</h2>
    <p>查看用户的书籍漂流记录</p>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <Layout>
                <BrowsePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <UserProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default App;
