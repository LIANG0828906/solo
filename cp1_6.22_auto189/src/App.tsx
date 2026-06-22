import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppointmentModal from './components/AppointmentModal';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import WorkDetailPage from './pages/WorkDetailPage';
import AdminPage from './pages/AdminPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio/:id" element={<PortfolioPage />} />
        <Route path="/work/:id" element={<WorkDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <AppointmentModal />
    </div>
  );
};

export default App;
