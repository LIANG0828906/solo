import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import EvaluationListPage from './pages/EvaluationListPage';
import ScoringPage from './pages/ScoringPage';
import HistoryTimelinePage from './pages/HistoryTimelinePage';
import { EvaluationTask, HistoryRecord } from '../shared/types';
import { getEvaluations, getHistory } from './services/apiService';

const CURRENT_USER_ID = 'emp-1';
const CURRENT_USER_NAME = '张三';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<EvaluationTask[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<EvaluationTask | null>(null);

  useEffect(() => {
    loadTasks();
    loadHistory();
  }, []);

  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      const data = await getEvaluations(CURRENT_USER_ID);
      setTasks(data);
    } catch (err) {
      console.error('加载评估任务失败:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await getHistory(CURRENT_USER_ID);
      setHistory(data);
    } catch (err) {
      console.error('加载历史记录失败:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectTask = (task: EvaluationTask) => {
    setSelectedTask(task);
    navigate(`/scoring/${task.id}`);
  };

  const handleBack = () => {
    setSelectedTask(null);
    navigate('/');
    loadTasks();
    loadHistory();
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <span className="brand-logo">PE</span>
            <span className="brand-text">绩效评估系统</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              评估任务
            </Link>
            <Link
              to="/history"
              className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
            >
              历史记录
            </Link>
          </div>
          <div className="nav-user">
            <span className="user-avatar">{CURRENT_USER_NAME.charAt(0)}</span>
            <span className="user-name">{CURRENT_USER_NAME}</span>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <EvaluationListPage
                tasks={tasks}
                loading={tasksLoading}
                onSelectTask={handleSelectTask}
                currentUser={CURRENT_USER_ID}
                currentUserName={CURRENT_USER_NAME}
              />
            }
          />
          <Route
            path="/scoring/:id"
            element={<ScoringPage task={selectedTask} onBack={handleBack} />}
          />
          <Route
            path="/history"
            element={<HistoryTimelinePage history={history} loading={historyLoading} />}
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
