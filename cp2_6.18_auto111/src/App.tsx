import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Home from '@/pages/Home';
import AnnouncementDetail from '@/pages/AnnouncementDetail';
import ActivityDetail from '@/pages/ActivityDetail';
import Profile from '@/pages/Profile';
import { useAppStore } from '@/store/appStore';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <div className="animate-fade-in" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/announcement/:id" element={<AnnouncementDetail />} />
        <Route path="/activity/:id" element={<ActivityDetail />} />
        <Route path="/my" element={<Profile />} />
      </Routes>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { fetchCurrentUser, fetchUsers } = useAppStore();

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, [fetchCurrentUser, fetchUsers]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="pt-16">
        <AnimatedRoutes />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
