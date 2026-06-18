import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PlantListPage from './pages/PlantListPage';
import PlantDetailPage from './pages/PlantDetailPage';

const App: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-title">🌿 花园小管家</div>
      </nav>

      <main className="main-container">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PlantListPage />} />
          <Route path="/plant/:id" element={<PlantDetailPage />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
