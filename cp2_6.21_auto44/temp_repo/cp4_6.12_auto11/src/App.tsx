import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudioPage from './pages/StudioPage';
import ProjectsPage from './pages/ProjectsPage';
import FabricDetailPage from './pages/FabricDetailPage';
import ProcurementPage from './pages/ProcurementPage';
import AdminFabricPage from './pages/AdminFabricPage';
import { useProjectStore } from './store/projectStore';
import { getCurrentUser } from './api/authApi';

const App: React.FC = () => {
  const { setUser, loadFabrics, user } = useProjectStore();

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      loadFabrics();
    }
  }, [setUser, loadFabrics]);

  useEffect(() => {
    if (user) {
      loadFabrics();
    }
  }, [user, loadFabrics]);

  return (
    <div style={styles.app}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/studio" element={user ? <StudioPage /> : <Navigate to="/" />} />
        <Route path="/projects" element={user ? <ProjectsPage /> : <Navigate to="/" />} />
        <Route path="/fabric/:id" element={user ? <FabricDetailPage /> : <Navigate to="/" />} />
        <Route path="/procurement/:id" element={user ? <ProcurementPage /> : <Navigate to="/" />} />
        <Route
          path="/admin/fabrics"
          element={user?.role === 'admin' ? <AdminFabricPage /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: '#F5F0E8',
    fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    color: '#5D4037',
  },
};

export default App;
