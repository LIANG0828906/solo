import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Sidebar from './components/Sidebar';
import ReviewPlaza from './pages/ReviewPlaza';
import ReviewEditor from './pages/ReviewEditor';
import DebateZone from './pages/DebateZone';
import Bookshelf from './pages/Bookshelf';
import { useUserStore } from './stores/userStore';
import './App.css';

const SettingsPage: React.FC = () => (
  <div className="settings-page">
    <h1 className="page-title">设置</h1>
    <div className="settings-content">
      <p>设置页面开发中...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, fetchCurrentUser } = useUserStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="app-container">
          <Sidebar user={user} />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<ReviewPlaza />} />
              <Route path="/review/new" element={<ReviewEditor />} />
              <Route path="/debate" element={<DebateZone />} />
              <Route path="/debate/:id" element={<DebateZone />} />
              <Route path="/bookshelf" element={<Bookshelf />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ConfigProvider>
  );
};

export default App;
