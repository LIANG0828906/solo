import { useState, useEffect } from 'react';
import ParticleBackground from '@/components/ParticleBackground';
import CreateActivity from '@/pages/CreateActivity';
import LotteryPage from '@/pages/LotteryPage';
import ResultPage from '@/pages/ResultPage';
import { api } from '@/utils/api';
import type { Activity, PageType } from '@/types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('create');
  const [currentActivityId, setCurrentActivityId] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await api.getActivities();
        setActivities(data);
        if (data.length > 0) {
          setCurrentActivityId(data[0].id);
        }
      } catch {
        // Ignore error
      }
    };
    loadActivities();
  }, []);

  const handleActivityCreated = (activityId: string) => {
    setCurrentActivityId(activityId);
    setCurrentPage('lottery');
  };

  const handleExport = () => {
    if (currentActivityId) {
      api.exportResults(currentActivityId);
    }
  };

  const handleNavClick = async (page: PageType) => {
    setCurrentPage(page);
    if (page === 'lottery' || page === 'results') {
      try {
        const data = await api.getActivities();
        setActivities(data);
        if (data.length > 0 && !currentActivityId) {
          setCurrentActivityId(data[0].id);
        }
      } catch {
        // Ignore error
      }
    }
  };

  return (
    <div className="app-container">
      <ParticleBackground />

      <nav className="nav-bar">
        <div className="nav-brand">🎉 互动抽奖系统</div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentPage === 'create' ? 'active' : ''}`}
            onClick={() => handleNavClick('create')}
          >
            创建活动
          </button>
          <button
            className={`nav-tab ${currentPage === 'lottery' ? 'active' : ''}`}
            onClick={() => handleNavClick('lottery')}
            disabled={activities.length === 0 && currentPage !== 'lottery'}
          >
            抽奖现场
          </button>
          <button
            className={`nav-tab ${currentPage === 'results' ? 'active' : ''}`}
            onClick={() => handleNavClick('results')}
          >
            历史记录
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'create' && (
          <CreateActivity onCreated={handleActivityCreated} />
        )}

        {currentPage === 'lottery' && (
          currentActivityId ? (
            <LotteryPage
              activityId={currentActivityId}
              onExport={handleExport}
            />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
              <h2 style={{ marginBottom: 12 }}>暂无活动</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                请先创建一个抽奖活动
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentPage('create')}
              >
                创建活动
              </button>
            </div>
          )
        )}

        {currentPage === 'results' && <ResultPage />}
      </main>
    </div>
  );
}

export default App;
