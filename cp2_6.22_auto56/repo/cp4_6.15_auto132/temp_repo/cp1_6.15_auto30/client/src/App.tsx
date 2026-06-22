import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import GoalDetailPage from './pages/GoalDetailPage';
import FocusPage from './pages/FocusPage';
import StatsPage from './pages/StatsPage';
import type { Goal, StudyRecord } from './types';
import { goalsApi, recordsApi } from './api';

const App: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [g, r] = await Promise.all([goalsApi.getAll(), recordsApi.getAll()]);
      setGoals(g);
      setRecords(r);
    } catch (e) {
      console.error('加载数据失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: '#667eea',
          fontWeight: 600,
          fontSize: 18,
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<DashboardPage goals={goals} setGoals={setGoals} />} />
        <Route
          path="/goal/:id"
          element={
            <GoalDetailPage
              goals={goals}
              records={records}
              setRecords={setRecords}
              setGoals={setGoals}
            />
          }
        />
        <Route path="/focus/:id" element={<FocusPage goals={goals} setGoals={setGoals} />} />
        <Route path="/stats" element={<StatsPage goals={goals} records={records} />} />
      </Routes>
    </div>
  );
};

export default App;
