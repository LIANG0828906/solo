import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopBar from './components/TopBar';
import HomePage from './pages/HomePage';
import ActivityListPage from './pages/ActivityListPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const { loading } = useStore();

  return (
    <Router>
      <div className="app">
        <TopBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/activities" element={<ActivityListPage />} />
            <Route path="/activity/:id" element={<ActivityDetailPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </main>
        
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" style={{ width: 40, height: 40 }} />
          </div>
        )}

        <style>{`
          .app {
            min-height: 100vh;
          }
          
          .main-content {
            min-height: calc(100vh - 60px);
            padding-top: 0;
          }
          
          .loading-overlay {
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 1000;
            background: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: fadeIn 0.2s ease;
          }
          
          .loading-overlay::after {
            content: '加载中...';
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </Router>
  );
};

export default App;
