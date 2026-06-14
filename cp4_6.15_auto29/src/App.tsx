import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import BrowsePage from '@/pages/BrowsePage';
import PublishPage from '@/pages/PublishPage';
import DetailPage from '@/pages/DetailPage';
import ProfilePage from '@/pages/ProfilePage';
import { useDataStore } from '@/utils/dataStore';

function AppContent() {
  const location = useLocation();
  const loadFromStorage = useDataStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-morandi-white">
      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/publish" element={<PublishPage />} />
        <Route path="/product/:id" element={<DetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <NavBar />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
