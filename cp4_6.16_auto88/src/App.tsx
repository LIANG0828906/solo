import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PlanPage } from '@/pages/PlanPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toast } from '@/components/ui/Toast';
import { useRouteStore } from '@/data/routeStore';

const AppContent = () => {
  const location = useLocation();
  const { loadFromStorage } = useRouteStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="app-container">
      <div className="page-content">
        <Routes>
          <Route path="/" element={<PlanPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </div>
      <BottomNav />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
