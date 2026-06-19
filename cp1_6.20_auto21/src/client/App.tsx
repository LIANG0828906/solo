import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import NotificationCenter from './components/NotificationCenter';
import SubmitPage from './pages/SubmitPage';
import RepairListPage from './pages/RepairListPage';
import RepairDetailPage from './pages/RepairDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<SubmitPage />} />
            <Route path="/repairs" element={<RepairListPage />} />
            <Route path="/repair/:id" element={<RepairDetailPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <NotificationCenter />
      </Router>
    </AppProvider>
  );
}
