import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useBoardStore } from './store/boardStore';
import BoardPage from './pages/BoardPage';
import LogDrawer from './components/LogDrawer/LogDrawer';

function App() {
  const fetchData = useBoardStore((s) => s.fetchData);
  const fetchLogs = useBoardStore((s) => s.fetchLogs);
  const [logsOpen, setLogsOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchLogs();

    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData, fetchLogs]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>团队协作看板</h1>
        <div className="user-info">
          <div className="avatar">我</div>
          <span>当前用户</span>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <LogDrawer open={logsOpen} onToggle={() => setLogsOpen(!logsOpen)} />
    </div>
  );
}

export default App;
