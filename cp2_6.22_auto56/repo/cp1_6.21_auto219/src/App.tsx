import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InspectionPage from './pages/InspectionPage';
import DashboardPage from './pages/DashboardPage';

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/inspection" replace />} />
        <Route path="/inspection" element={<InspectionPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/inspection" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
