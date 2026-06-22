import { useState, useEffect, useCallback } from 'react';
import Dashboard from './Dashboard';
import ActivityDetail from './ActivityDetail';
import type { Activity, ActivityDetail as ActivityDetailType } from '../types';

type View = 'dashboard' | 'detail';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityDetail, setActivityDetail] = useState<ActivityDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch('/api/activities');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }, []);

  const fetchActivityDetail = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/activities/${id}`);
      const data = await response.json();
      setActivityDetail(data);
    } catch (error) {
      console.error('Failed to fetch activity detail:', error);
    }
  }, []);

  useEffect(() => {
    fetchActivities().finally(() => setIsLoading(false));
    const interval = setInterval(fetchActivities, 5000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  useEffect(() => {
    if (view === 'detail' && selectedActivityId) {
      fetchActivityDetail(selectedActivityId);
      const interval = setInterval(() => fetchActivityDetail(selectedActivityId), 5000);
      return () => clearInterval(interval);
    }
  }, [view, selectedActivityId, fetchActivityDetail]);

  const handleActivityClick = (id: string) => {
    setSelectedActivityId(id);
    setView('detail');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedActivityId(null);
    setActivityDetail(null);
  };

  const handleCreateActivity = () => {
    setView('dashboard');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title" onClick={handleBackToDashboard}>
          促销活动实时追踪平台
        </h1>
        {view === 'dashboard' && (
          <button className="btn btn-primary" onClick={handleCreateActivity}>
            + 创建活动
          </button>
        )}
        {view === 'detail' && (
          <button className="btn btn-secondary" onClick={handleBackToDashboard}>
            ← 返回仪表盘
          </button>
        )}
      </header>

      <main className="main-content">
        {isLoading && view === 'dashboard' ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">加载中...</div>
          </div>
        ) : view === 'dashboard' ? (
          <Dashboard
            activities={activities}
            onActivityClick={handleActivityClick}
            onActivityCreated={fetchActivities}
          />
        ) : (
          <ActivityDetail
            activity={activityDetail}
            onRefresh={() => selectedActivityId && fetchActivityDetail(selectedActivityId)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
