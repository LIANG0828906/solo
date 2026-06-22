import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import TaskList from './modules/task/TaskList';
import TaskDetail from './modules/task/TaskDetail';
import StatsDashboard from './components/StatsDashboard';
import Leaderboard from './components/Leaderboard';
import SettingsPage from './pages/SettingsPage';
import { useTaskStore } from './modules/task/taskStore';
import { useUserStore } from './modules/user/userStore';
import { useTimerStore } from './modules/timer/timerStore';

function App() {
  const location = useLocation();
  const taskInit = useTaskStore((state) => state.init);
  const userInit = useUserStore((state) => state.init);
  const isTaskLoading = useTaskStore((state) => state.isLoading);
  const isUserLoading = useUserStore((state) => state.isLoading);
  const lastToast = useTimerStore((state) => state.lastToast);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pageKey, setPageKey] = useState(location.pathname);

  useEffect(() => {
    const init = async () => {
      await Promise.all([taskInit(), userInit()]);
      setIsInitialized(true);
    };
    init();
  }, [taskInit, userInit]);

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  if (!isInitialized || isTaskLoading || isUserLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F0F5FF]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#F0F5FF]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <div className="mobile-header flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <h1 className="font-bold text-gray-800">TeamTally</h1>
        </div>

        <div key={pageKey} className="flex-1 p-6 overflow-hidden main-content">
          <div
            className="h-full"
            style={{
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <Routes>
              <Route path="/" element={<TaskList />} />
              <Route path="/task/:id" element={<TaskDetail />} />
              <Route path="/dashboard" element={<StatsDashboard />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
      </main>

      <MobileNav />

      {lastToast && <div className="toast">{lastToast}</div>}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;
