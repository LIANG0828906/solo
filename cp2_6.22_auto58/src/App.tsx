import { Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import DashboardView from './views/DashboardView';
import TimerView from './views/TimerView';
import StatisticsView from './views/StatisticsView';
import { Task } from './types';
import { taskService } from './services/taskService';
import './styles/App.css';

interface AppContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  refreshTasks: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTasks = async () => {
    try {
      const data = await taskService.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <AppContext.Provider value={{ tasks, setTasks, refreshTasks }}>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            <span className="logo-icon">⏱</span>
            <span className="logo-text">专注看板</span>
          </div>
          <div className="nav-links">
            <NavLink to="/" className="nav-link" end>
              <span className="nav-icon">📋</span>
              <span>任务看板</span>
            </NavLink>
            <NavLink to="/timer" className="nav-link">
              <span className="nav-icon">⏰</span>
              <span>专注计时</span>
            </NavLink>
            <NavLink to="/statistics" className="nav-link">
              <span className="nav-icon">📊</span>
              <span>统计报告</span>
            </NavLink>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/timer" element={<TimerView />} />
            <Route path="/statistics" element={<StatisticsView />} />
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default App;
