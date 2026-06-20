import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MyTasksPage from './pages/MyTasksPage';
import UserProfilePage from './pages/UserProfilePage';
import { useStore } from './store';

function AppInner() {
  const init = useStore((s) => s.init);
  const initialized = useStore((s) => s.initialized);

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"
          />
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/my-tasks" element={<MyTasksPage />} />
      <Route path="/profile" element={<UserProfilePage />} />
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <h2 className="text-xl font-semibold text-slate-700">页面不存在</h2>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              返回首页
            </a>
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
