import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GalleryDetailPage from './pages/GalleryDetailPage';
import ArtworkViewPage from './pages/ArtworkViewPage';

const App: React.FC = () => {
  const location = useLocation();
  const showNavbar = !['/login', '/register'].includes(location.pathname);

  return (
    <div className="app">
      {showNavbar && <Navbar />}
      <main key={location.pathname} className="page-fade-in">
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/gallery/:id" element={<GalleryDetailPage />} />
          <Route path="/view/:id" element={<ArtworkViewPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
