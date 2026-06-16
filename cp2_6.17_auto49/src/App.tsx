import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFitTrackyStore } from './store';
import Sidebar from './components/Sidebar';
import RecordPage from './pages/RecordPage';
import PlanPage from './pages/PlanPage';
import './App.css';

const App: React.FC = () => {
  const loadFromIndexedDB = useFitTrackyStore((state) => state.loadFromIndexedDB);
  const userSettings = useFitTrackyStore((state) => state.userSettings);

  useEffect(() => {
    loadFromIndexedDB();
  }, [loadFromIndexedDB]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar nickname={userSettings.nickname} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RecordPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
