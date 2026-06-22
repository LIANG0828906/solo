import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import { useThemeInit } from './store/themeStore';

const App: React.FC = () => {
  useThemeInit();

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
